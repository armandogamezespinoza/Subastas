package com.subasta.subasta_backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.subasta.dto.BuyerRegistrationDto;
import com.subasta.dto.SellerRegistrationDto;
import com.subasta.dto.SendCodeRequest;
import com.subasta.entity.Comprador;
import com.subasta.entity.Usuario;
import com.subasta.entity.Vendedor;
import com.subasta.repository.CompradorRepository;
import com.subasta.repository.UsuarioRepository;
import com.subasta.repository.VendedorRepository;
import com.subasta.security.JwtService;
import com.subasta.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class QaBackendFixesTests {

    record SentEmail(String to, String subject, String body) {}

    static class RecordingEmailService extends EmailService {
        private final List<SentEmail> sentCustomEmails = new CopyOnWriteArrayList<>();

        RecordingEmailService(ObjectMapper objectMapper) {
            super(null, objectMapper);
        }

        public List<SentEmail> getSentCustomEmails() {
            return sentCustomEmails;
        }

        public void awaitCount(int expectedCount) throws InterruptedException {
            long deadline = System.currentTimeMillis() + 3000;
            while (sentCustomEmails.size() < expectedCount && System.currentTimeMillis() < deadline) {
                Thread.sleep(50);
            }
        }

        @Override
        public void sendCustomEmail(String toEmail, String subject, String body) {
            sentCustomEmails.add(new SentEmail(toEmail, subject, body));
        }

        @Override
        public void sendVerificationCode(String toEmail, String code) {}

        @Override
        public void sendPasswordResetCode(String toEmail, String code) {}
    }

    @TestConfiguration
    static class TestEmailConfig {
        @Bean
        @Primary
        RecordingEmailService recordingEmailService(ObjectMapper objectMapper) {
            return new RecordingEmailService(objectMapper);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CompradorRepository compradorRepository;

    @Autowired
    private VendedorRepository vendedorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RecordingEmailService emailService;

    @BeforeEach
    void setUp() {
        emailService.getSentCustomEmails().clear();
        compradorRepository.deleteAll();
        vendedorRepository.deleteAll();
        usuarioRepository.deleteAll();
    }

    private BuyerRegistrationDto buildBuyerDto(String email, String verifiedEmailToken) {
        BuyerRegistrationDto dto = new BuyerRegistrationDto();
        dto.setEmail(email);
        dto.setTelefono("6671234567");
        dto.setTipoPersona("FISICA");
        dto.setNombres("Carlos");
        dto.setApellidoPaterno("López");
        dto.setRfc("LOLC900101AB1");
        dto.setCalle("Av. Reforma 123");
        dto.setCodigoPostal("80000");
        dto.setColonia("Centro");
        dto.setCiudad("Culiacán");
        dto.setEstado("Sinaloa");
        dto.setPassword("Secret123!");
        dto.setVerifiedEmailToken(verifiedEmailToken);
        return dto;
    }

    private SellerRegistrationDto buildSellerDto(String email, String verifiedEmailToken) {
        SellerRegistrationDto dto = new SellerRegistrationDto();
        dto.setEmail(email);
        dto.setTelefono("6677654321");
        dto.setTipoPersona("FISICA");
        dto.setNombres("María");
        dto.setApellidoPaterno("García");
        dto.setRfc("GAGM920202XY2");
        dto.setCalle("Blvd. Zapata");
        dto.setNumero("456");
        dto.setCodigoPostal("80100");
        dto.setColonia("Las Quintas");
        dto.setCiudad("Culiacán");
        dto.setMunicipio("Culiacán");
        dto.setEstado("Sinaloa");
        dto.setPassword("Secret123!");
        dto.setVerifiedEmailToken(verifiedEmailToken);
        return dto;
    }

    private MockMultipartFile jsonPart(Object dto) throws Exception {
        return new MockMultipartFile(
                "datos",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(dto)
        );
    }

    @Test
    @DisplayName("QA-1: Onboarding rechaza solicitud si el correo no tiene verifiedEmailToken válido")
    void testOnboardingRequiresVerifiedEmailToken() throws Exception {
        BuyerRegistrationDto withoutToken = buildBuyerDto("noverificado@subasta.mx", null);
        mockMvc.perform(multipart("/api/v1/onboarding/buyer")
                        .file(jsonPart(withoutToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        String otherEmailToken = jwtService.createVerifiedEmailToken("otro@subasta.mx");
        BuyerRegistrationDto mismatchedToken = buildBuyerDto("noverificado@subasta.mx", otherEmailToken);
        mockMvc.perform(multipart("/api/v1/onboarding/buyer")
                        .file(jsonPart(mismatchedToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        SellerRegistrationDto sellerWithoutToken = buildSellerDto("sellernoverif@subasta.mx", null);
        mockMvc.perform(multipart("/api/v1/onboarding/seller")
                        .file(jsonPart(sellerWithoutToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("QA-2: Usuario recién registrado (no aprobado) no puede iniciar sesión ni obtener JWT")
    void testUnapprovedUserCannotLoginOrGetJwt() throws Exception {
        String email = "pendiente@subasta.mx";
        String verifiedToken = jwtService.createVerifiedEmailToken(email);
        BuyerRegistrationDto dto = buildBuyerDto(email, verifiedToken);

        mockMvc.perform(multipart("/api/v1/onboarding/buyer")
                        .file(jsonPart(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        Usuario savedUser = usuarioRepository.findByEmail(email).orElseThrow();
        assertThat(savedUser.getActivo()).isFalse();
        assertThat(savedUser.getEstatus()).isEqualTo("ENVIADO");

        // Intentar login en estado ENVIADO -> 403, sin accessToken
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "identifier", email,
                                "password", "Secret123!"
                        ))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.accessToken").doesNotExist())
                .andExpect(jsonPath("$.error").isNotEmpty());

        // Cambiar a RECIBIDO -> sigue sin poder iniciar sesión
        Comprador comp = compradorRepository.findByEmail(email).orElseThrow();
        String adminToken = jwtService.createAccessToken("admin@subasta.mx", "ADMINISTRADOR");

        mockMvc.perform(put("/api/v1/revision/solicitudes/COMPRADOR/" + comp.getId() + "/estatus")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("estatus", "RECIBIDO"))))
                .andExpect(status().isOk());

        Usuario afterRecibido = usuarioRepository.findByEmail(email).orElseThrow();
        assertThat(afterRecibido.getEstatus()).isEqualTo("RECIBIDO");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "identifier", email,
                                "password", "Secret123!"
                        ))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.accessToken").doesNotExist());

        // Cambiar a APROBADO -> ahora sí puede iniciar sesión y recibe JWT
        mockMvc.perform(put("/api/v1/revision/solicitudes/COMPRADOR/" + comp.getId() + "/estatus")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("estatus", "APROBADO"))))
                .andExpect(status().isOk());

        Usuario afterAprobado = usuarioRepository.findByEmail(email).orElseThrow();
        assertThat(afterAprobado.getEstatus()).isEqualTo("APROBADO");
        assertThat(afterAprobado.getActivo()).isTrue();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "identifier", email,
                                "password", "Secret123!"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    @DisplayName("QA-3: No puede haber dos usuarios con el mismo correo (retorna 409 sin error 500)")
    void testDuplicateEmailRegistrationRejectedCleanly() throws Exception {
        String email = "duplicado@subasta.mx";
        String verifiedToken = jwtService.createVerifiedEmailToken(email);

        mockMvc.perform(multipart("/api/v1/onboarding/buyer")
                        .file(jsonPart(buildBuyerDto(email, verifiedToken))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Segundo intento con el mismo correo (incluso con mayúsculas)
        String upperToken = jwtService.createVerifiedEmailToken(email);
        mockMvc.perform(multipart("/api/v1/onboarding/buyer")
                        .file(jsonPart(buildBuyerDto("DUPLICADO@subasta.mx", upperToken))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").isNotEmpty());

        // Intento como vendedor con el mismo correo
        mockMvc.perform(multipart("/api/v1/onboarding/seller")
                        .file(jsonPart(buildSellerDto(email, verifiedToken))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));

        // Intento de send-code con checkDuplicate=true para correo ya registrado -> 409 Conflict
        mockMvc.perform(post("/api/v1/auth/send-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "checkDuplicate", true
                        ))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));

        assertThat(usuarioRepository.findAll()).hasSize(1);
    }

    @Test
    @DisplayName("QA-4: Recuperar contraseña valida existencia de correo y aprobación para comprador/vendedor")
    void testForgotPasswordValidatesExistenceAndApprovalByRole() throws Exception {
        // 1. Correo no registrado -> rechazado (404)
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SendCodeRequest("noexiste@subasta.mx"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.challengeToken").doesNotExist());

        // 2. Comprador NO aprobado -> rechazado (403)
        Usuario unapprovedBuyer = new Usuario(null, "comprador.pendiente@subasta.mx", passwordEncoder.encode("Pass123!"), "COMPRADOR", false, LocalDateTime.now());
        unapprovedBuyer.setEstatus("ENVIADO");
        usuarioRepository.save(unapprovedBuyer);

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SendCodeRequest("comprador.pendiente@subasta.mx"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.challengeToken").doesNotExist());

        // 3. Comprador APROBADO -> permitido (200)
        Usuario approvedBuyer = new Usuario(null, "comprador.aprobado@subasta.mx", passwordEncoder.encode("Pass123!"), "COMPRADOR", true, LocalDateTime.now());
        approvedBuyer.setEstatus("APROBADO");
        usuarioRepository.save(approvedBuyer);

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SendCodeRequest("comprador.aprobado@subasta.mx"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.challengeToken").isNotEmpty());

        // 4. Administrador o Aprobador -> solo corrobora que exista el correo (200)
        Usuario admin = new Usuario(null, "admin.rec@subasta.mx", passwordEncoder.encode("Pass123!"), "ADMINISTRADOR", true, LocalDateTime.now());
        usuarioRepository.save(admin);

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SendCodeRequest("admin.rec@subasta.mx"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.challengeToken").isNotEmpty());
    }

    @Test
    @DisplayName("QA-6: Cambio a APROBADO envía notificación por correo con formato esperado y soporta correo personalizado en EN_REVISION")
    void testApprovalSendsEmailAndCustomEmailWorks() throws Exception {
        String email = "aprobacion@subasta.mx";
        String verifiedToken = jwtService.createVerifiedEmailToken(email);

        MvcResult regResult = mockMvc.perform(multipart("/api/v1/onboarding/buyer")
                        .file(jsonPart(buildBuyerDto(email, verifiedToken))))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode regNode = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String folio = regNode.get("folio").asText();
        Comprador comp = compradorRepository.findByEmail(email).orElseThrow();

        String adminToken = jwtService.createAccessToken("admin@subasta.mx", "ADMINISTRADOR");

        // 1. Cambiar a EN_REVISION con asunto y mensaje personalizados
        mockMvc.perform(put("/api/v1/revision/solicitudes/COMPRADOR/" + comp.getId() + "/estatus")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "estatus", "EN_REVISION",
                                "asunto", "Solicitud en revisión",
                                "mensaje", "Tu solicitud está siendo revisada por nuestro equipo."
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estatus").value("EN_REVISION"));

        emailService.awaitCount(1);
        assertThat(emailService.getSentCustomEmails()).hasSize(1);
        SentEmail revisionMail = emailService.getSentCustomEmails().get(0);
        assertThat(revisionMail.to()).isEqualTo(email);
        assertThat(revisionMail.subject()).isEqualTo("Solicitud en revisión");
        assertThat(revisionMail.body()).isEqualTo("Tu solicitud está siendo revisada por nuestro equipo.");

        // 2. Cambiar a APROBADO -> envía correo automático de aprobación
        mockMvc.perform(put("/api/v1/revision/solicitudes/COMPRADOR/" + comp.getId() + "/estatus")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("estatus", "APROBADO"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estatus").value("APROBADO"));

        emailService.awaitCount(2);
        assertThat(emailService.getSentCustomEmails()).hasSize(2);
        SentEmail approvalMail = emailService.getSentCustomEmails().get(1);
        assertThat(approvalMail.to()).isEqualTo(email);
        assertThat(approvalMail.body()).contains("Felicidades, Carlos");
        assertThat(approvalMail.body()).contains("Tu petición con folio " + folio + " ha sido aprobada por el administrador de la plataforma.");
        assertThat(approvalMail.body()).contains("Ya puedes iniciar sesión con tu cuenta.");
        assertThat(approvalMail.body()).contains("Te esperamos.");

        // 3. Cambiar a NEGADO -> desactiva usuario y bloquea login
        mockMvc.perform(put("/api/v1/revision/solicitudes/COMPRADOR/" + comp.getId() + "/estatus")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("estatus", "NEGADO"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estatus").value("NEGADO"));

        Usuario deniedUser = usuarioRepository.findByEmail(email).orElseThrow();
        assertThat(deniedUser.getActivo()).isFalse();
        assertThat(deniedUser.getEstatus()).isEqualTo("NEGADO");
    }
}
