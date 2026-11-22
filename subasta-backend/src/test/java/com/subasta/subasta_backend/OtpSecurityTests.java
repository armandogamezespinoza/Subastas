package com.subasta.subasta_backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.subasta.dto.SendCodeRequest;
import com.subasta.dto.VerifyCodeRequest;
import com.subasta.entity.Usuario;
import com.subasta.repository.UsuarioRepository;
import com.subasta.security.JwtService;
import com.subasta.service.VerificationCodeService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class OtpSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private VerificationCodeService verificationCodeService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        usuarioRepository.deleteAll();
    }

    @Test
    @DisplayName("VULN-02: ChallengeToken no debe exponer codeHash en su payload JWT")
    void testChallengeTokenDoesNotExposeCodeHash() throws Exception {
        SendCodeRequest req = new SendCodeRequest();
        req.setEmail("seguridad@subasta.mx");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/send-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.challengeToken").isNotEmpty())
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(result.getResponse().getContentAsString());
        String challengeToken = responseNode.get("challengeToken").asText();

        Claims claims = jwtService.parseToken(challengeToken);
        assertThat(claims.get("codeHash")).isNull();
        assertThat(claims.get("challengeId", String.class)).isNotBlank();
        assertThat(claims.getSubject()).isEqualTo("seguridad@subasta.mx");
    }

    @Test
    @DisplayName("VULN-02: Intento fallido con código erróneo decrementa intentos y bloquea tras 3 fallos")
    void testFailedOtpAttemptsExhaustion() throws Exception {
        SendCodeRequest req = new SendCodeRequest();
        req.setEmail("testlimit@subasta.mx");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/send-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(result.getResponse().getContentAsString());
        String challengeToken = responseNode.get("challengeToken").asText();

        // 1er intento incorrecto
        mockMvc.perform(post("/api/v1/auth/verify-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyCodeRequest("000000", challengeToken))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Código de verificación incorrecto. Intentos restantes: 2"));

        // 2do intento incorrecto
        mockMvc.perform(post("/api/v1/auth/verify-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyCodeRequest("111111", challengeToken))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Código de verificación incorrecto. Intentos restantes: 1"));

        // 3er intento incorrecto (alcanza el límite y se invalida)
        mockMvc.perform(post("/api/v1/auth/verify-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyCodeRequest("222222", challengeToken))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Has superado el límite de intentos permitidos. Solicita un nuevo código."));

        // 4to intento: token ya invalidado
        mockMvc.perform(post("/api/v1/auth/verify-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyCodeRequest("333333", challengeToken))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("El código ha expirado o el token es inválido"));
    }

    @Test
    @DisplayName("VULN-02: Código correcto verifica exitosamente y no puede ser reutilizado (Replay Protection)")
    void testSuccessfulOtpVerificationAndReplayPrevention() throws Exception {
        String email = "valido@subasta.mx";
        SendCodeRequest req = new SendCodeRequest();
        req.setEmail(email);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/send-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(result.getResponse().getContentAsString());
        String challengeToken = responseNode.get("challengeToken").asText();

        Claims claims = jwtService.parseToken(challengeToken);
        String challengeId = claims.get("challengeId", String.class);
        String validCode = verificationCodeService.getCodeForChallenge(challengeId);

        // Verificación exitosa
        mockMvc.perform(post("/api/v1/auth/verify-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyCodeRequest(validCode, challengeToken))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.verified").value(true))
                .andExpect(jsonPath("$.verifiedEmailToken").isNotEmpty());

        // Reintento con el mismo código (Ataque de repetición) debe ser rechazado
        mockMvc.perform(post("/api/v1/auth/verify-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyCodeRequest(validCode, challengeToken))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("El código ha expirado o el token es inválido"));
    }

    @Test
    @DisplayName("VULN-02: Prevenir enumeración de usuarios respondiendo con mensaje genérico uniforme")
    void testUserEnumerationPreventionOnLogin() throws Exception {
        Usuario user = new Usuario(null, "registrado@subasta.mx", passwordEncoder.encode("RealPassword123!"), "COMPRADOR", true, LocalDateTime.now());
        usuarioRepository.save(user);

        // Caso 1: Usuario NO registrado
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("identifier", "noexiste@subasta.mx", "password", "Cualquiera123!"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Credenciales incorrectas"));

        // Caso 2: Usuario registrado pero contraseña incorrecta
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("identifier", "registrado@subasta.mx", "password", "Equivocada123!"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Credenciales incorrectas"));
    }
}

