package com.subasta.subasta_backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.subasta.dto.ResetPasswordRequest;
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
class PasswordRecoverySecurityTests {

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
    @DisplayName("Password Recovery: Solicitud con usuario registrado vs no registrado (Anti-Enumeración)")
    void testForgotPasswordAntiEnumeration() throws Exception {
        Usuario user = new Usuario(null, "registrado@subasta.mx", passwordEncoder.encode("Password123!"), "COMPRADOR", true, LocalDateTime.now());
        usuarioRepository.save(user);

        // Caso 1: Usuario registrado
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SendCodeRequest("registrado@subasta.mx"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.challengeToken").isNotEmpty())
                .andExpect(jsonPath("$.message").value("Si tu correo se encuentra registrado, recibirás un código de verificación en breve."));

        // Caso 2: Usuario NO registrado (misma respuesta exterior)
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SendCodeRequest("noexiste@subasta.mx"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.challengeToken").isNotEmpty())
                .andExpect(jsonPath("$.message").value("Si tu correo se encuentra registrado, recibirás un código de verificación en breve."));
    }

    @Test
    @DisplayName("Password Recovery: Flujo completo (forgot-password -> verify-reset-code -> reset-password -> login exitoso)")
    void testCompletePasswordRecoveryFlow() throws Exception {
        String email = "recuperar@subasta.mx";
        String initialPassword = "OldPassword123!";
        String newPassword = "NewPassword456$";

        Usuario user = new Usuario(null, email, passwordEncoder.encode(initialPassword), "COMPRADOR", true, LocalDateTime.now());
        usuarioRepository.save(user);

        // 1. Solicitar código de recuperación
        MvcResult forgotResult = mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SendCodeRequest(email))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        JsonNode forgotNode = objectMapper.readTree(forgotResult.getResponse().getContentAsString());
        String challengeToken = forgotNode.get("challengeToken").asText();

        Claims claims = jwtService.parseToken(challengeToken);
        String challengeId = claims.get("challengeId", String.class);
        String code = verificationCodeService.getCodeForChallenge(challengeId);

        // 2. Intento con código erróneo
        mockMvc.perform(post("/api/v1/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyCodeRequest("000000", challengeToken))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Código de verificación incorrecto. Intentos restantes: 2"));

        // 3. Verificación con código correcto -> Emite resetToken
        MvcResult verifyResult = mockMvc.perform(post("/api/v1/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyCodeRequest(code, challengeToken))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.verified").value(true))
                .andExpect(jsonPath("$.resetToken").isNotEmpty())
                .andReturn();

        JsonNode verifyNode = objectMapper.readTree(verifyResult.getResponse().getContentAsString());
        String resetToken = verifyNode.get("resetToken").asText();

        // 4. Intentar reset con contraseña débil (< 8 chars o sin especial)
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ResetPasswordRequest(resetToken, "debil"))))
                .andExpect(status().isBadRequest());

        // 5. Reset con contraseña segura
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ResetPasswordRequest(resetToken, newPassword))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña."));

        // 6. Verificar que la contraseña anterior ya no funciona
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("identifier", email, "password", initialPassword))))
                .andExpect(status().isUnauthorized());

        // 7. Iniciar sesión con la nueva contraseña exitosamente
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("identifier", email, "password", newPassword))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }
}

