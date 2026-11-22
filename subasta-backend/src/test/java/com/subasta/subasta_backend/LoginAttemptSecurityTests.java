package com.subasta.subasta_backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.subasta.entity.Usuario;
import com.subasta.repository.UsuarioRepository;
import com.subasta.security.JwtService;
import com.subasta.service.LoginAttemptService;
import com.subasta.service.VerificationCodeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class LoginAttemptSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private LoginAttemptService loginAttemptService;

    @Autowired
    private VerificationCodeService verificationCodeService;

    @BeforeEach
    void setUp() {
        usuarioRepository.deleteAll();
        // Limpiar estado del servicio entre tests
        loginAttemptService.clearAttempts("brute-force@subasta.mx");
        loginAttemptService.clearAttempts("victima@subasta.mx");
        loginAttemptService.clearAttempts("noexiste@subasta.mx");
        loginAttemptService.clearAttempts("reset-test@subasta.mx");
        loginAttemptService.clearAttempts("6671111111");
    }

    // =========================================================================
    // LoginAttemptService unit tests
    // =========================================================================

    @Test
    @DisplayName("RATE-01: LoginAttemptService bloquea después de 5 intentos fallidos")
    void testServiceBlocksAfterMaxAttempts() {
        String identifier = "unit-test@example.com";

        for (int i = 0; i < LoginAttemptService.MAX_ATTEMPTS; i++) {
            assertThat(loginAttemptService.isBlocked(identifier)).isFalse();
            loginAttemptService.registerFailedAttempt(identifier);
        }

        assertThat(loginAttemptService.isBlocked(identifier)).isTrue();
        assertThat(loginAttemptService.getLockoutSecondsRemaining(identifier)).isGreaterThan(0);
        assertThat(loginAttemptService.getLockoutSecondsRemaining(identifier)).isLessThanOrEqualTo(LoginAttemptService.LOCKOUT_SECONDS);

        // Cleanup
        loginAttemptService.clearAttempts(identifier);
    }

    @Test
    @DisplayName("RATE-02: clearAttempts() reinicia el contador y desbloquea")
    void testClearResetsEverything() {
        String identifier = "clear-test@example.com";

        for (int i = 0; i < LoginAttemptService.MAX_ATTEMPTS; i++) {
            loginAttemptService.registerFailedAttempt(identifier);
        }
        assertThat(loginAttemptService.isBlocked(identifier)).isTrue();

        loginAttemptService.clearAttempts(identifier);
        assertThat(loginAttemptService.isBlocked(identifier)).isFalse();
        assertThat(loginAttemptService.getFailedAttempts(identifier)).isEqualTo(0);
    }

    @Test
    @DisplayName("RATE-03: Normalización case-insensitive para email")
    void testNormalizationIsCaseInsensitive() {
        loginAttemptService.registerFailedAttempt("Test@Example.COM");
        assertThat(loginAttemptService.getFailedAttempts("test@example.com")).isEqualTo(1);
        loginAttemptService.clearAttempts("test@example.com");
    }

    // =========================================================================
    // Integration tests via AuthController
    // =========================================================================

    @Test
    @DisplayName("RATE-04: Login bloquea tras 5 intentos fallidos con credenciales incorrectas")
    void testLoginBlockedAfter5FailedAttempts() throws Exception {
        Usuario user = new Usuario(null, "brute-force@subasta.mx",
                passwordEncoder.encode("CorrectPassword1!"), "COMPRADOR", true, LocalDateTime.now());
        usuarioRepository.save(user);

        // 5 intentos fallidos con contraseña incorrecta
        for (int i = 1; i <= 5; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "identifier", "brute-force@subasta.mx",
                                    "password", "WrongPassword" + i + "!"
                            ))))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error").value("Credenciales incorrectas"));
        }

        // El 6to intento debe ser HTTP 429 (aún con la contraseña correcta)
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "identifier", "brute-force@subasta.mx",
                                "password", "CorrectPassword1!"
                        ))))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").exists())
                .andExpect(header().exists("Retry-After"));
    }

    @Test
    @DisplayName("RATE-05: Cuenta inexistente también genera bloqueo (anti-enumeración)")
    void testNonExistentAccountAlsoBlocked() throws Exception {
        // 5 intentos con cuenta inexistente
        for (int i = 1; i <= 5; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "identifier", "noexiste@subasta.mx",
                                    "password", "Anything" + i + "!"
                            ))))
                    .andExpect(status().isUnauthorized());
        }

        // El 6to intento devuelve 429
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "identifier", "noexiste@subasta.mx",
                                "password", "Whatever1!"
                        ))))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    @DisplayName("RATE-06: Respuesta idéntica para cuenta bloqueada existente vs inexistente")
    void testBlockedResponseDoesNotRevealAccountExistence() throws Exception {
        // Crear un usuario real
        Usuario user = new Usuario(null, "victima@subasta.mx",
                passwordEncoder.encode("Password1!"), "COMPRADOR", true, LocalDateTime.now());
        usuarioRepository.save(user);

        // Bloquear ambos
        for (int i = 0; i < 5; i++) {
            loginAttemptService.registerFailedAttempt("victima@subasta.mx");
            loginAttemptService.registerFailedAttempt("fantasma@subasta.mx");
        }

        // La respuesta debe ser idéntica para ambos
        String existentResponse = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "identifier", "victima@subasta.mx",
                                "password", "x"
                        ))))
                .andExpect(status().isTooManyRequests())
                .andReturn().getResponse().getContentAsString();

        String nonExistentResponse = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "identifier", "fantasma@subasta.mx",
                                "password", "x"
                        ))))
                .andExpect(status().isTooManyRequests())
                .andReturn().getResponse().getContentAsString();

        // Ambos deben tener el mismo mensaje de error
        var existentJson = objectMapper.readTree(existentResponse);
        var nonExistentJson = objectMapper.readTree(nonExistentResponse);
        assertThat(existentJson.get("error").asText()).isEqualTo(nonExistentJson.get("error").asText());

        loginAttemptService.clearAttempts("fantasma@subasta.mx");
    }

    @Test
    @DisplayName("RATE-07: Login exitoso reinicia el contador de intentos fallidos")
    void testSuccessfulLoginResetsCounter() throws Exception {
        Usuario user = new Usuario(null, "reset-test@subasta.mx",
                passwordEncoder.encode("CorrectPassword1!"), "COMPRADOR", true, LocalDateTime.now());
        usuarioRepository.save(user);

        // 3 intentos fallidos (por debajo del límite)
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "identifier", "reset-test@subasta.mx",
                                    "password", "Wrong" + i + "!"
                            ))))
                    .andExpect(status().isUnauthorized());
        }

        // Login exitoso
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "identifier", "reset-test@subasta.mx",
                                "password", "CorrectPassword1!"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Verificar que el contador se reinició
        assertThat(loginAttemptService.getFailedAttempts("reset-test@subasta.mx")).isEqualTo(0);
    }

    @Test
    @DisplayName("RATE-08: Login bloqueado incluye cabecera Retry-After")
    void testBlockedLoginIncludesRetryAfterHeader() throws Exception {
        // Bloquear directamente via servicio
        for (int i = 0; i < 5; i++) {
            loginAttemptService.registerFailedAttempt("6671111111");
        }

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "identifier", "6671111111",
                                "password", "x"
                        ))))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
    }

    @Test
    @DisplayName("RATE-09: send-code con cooldown incluye cabecera Retry-After")
    void testSendCodeRetryAfterHeader() throws Exception {
        String email = "retry-after-test-" + System.currentTimeMillis() + "@subasta.mx";

        // Primer envío exitoso
        mockMvc.perform(post("/api/v1/auth/send-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email))))
                .andExpect(status().isOk());

        // Segundo envío dentro de cooldown — debe incluir Retry-After
        mockMvc.perform(post("/api/v1/auth/send-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email))))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // Regression tests: legitimate users still work
    // =========================================================================

    @Test
    @DisplayName("REGR-01: Usuario legítimo puede iniciar sesión normalmente")
    void testLegitimateUserCanLogin() throws Exception {
        Usuario user = new Usuario(null, "legit@subasta.mx",
                passwordEncoder.encode("ValidPassword1!"), "COMPRADOR", true, LocalDateTime.now());
        user.setTelefono("6670001111");
        usuarioRepository.save(user);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "identifier", "legit@subasta.mx",
                                "password", "ValidPassword1!"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("legit@subasta.mx"));
    }
}

