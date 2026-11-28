package com.subasta.subasta_backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.subasta.entity.Comprador;
import com.subasta.entity.Usuario;
import com.subasta.repository.CompradorRepository;
import com.subasta.repository.EmailTemplateRepository;
import com.subasta.repository.UsuarioRepository;
import com.subasta.security.JwtService;
import com.subasta.service.EmailTemplateService;
import com.subasta.service.RequestExpirationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class OnboardingAndRevisionTemplatesTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EmailTemplateRepository emailTemplateRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CompradorRepository compradorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RequestExpirationService requestExpirationService;

    private String adminToken;

    @BeforeEach
    void setUp() {
        adminToken = jwtService.createAccessToken("admin@subasta.mx", "ADMINISTRADOR");
    }

    @Test
    @DisplayName("Plantillas base se inicializan en BD y se exponen con variables de entorno")
    void templatesAreSeededAndExposed() throws Exception {
        assertThat(emailTemplateRepository.findByCodigo(EmailTemplateService.TEMPLATE_APROBACION)).isPresent();
        assertThat(emailTemplateRepository.findByCodigo(EmailTemplateService.TEMPLATE_OBSERVACION_DOCUMENTO)).isPresent();
        assertThat(emailTemplateRepository.findByCodigo(EmailTemplateService.TEMPLATE_RECHAZO_DIRECTO)).isPresent();

        mockMvc.perform(get("/api/v1/revision/plantillas")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plantillas.length()").value(3))
                .andExpect(jsonPath("$.parametrosEntorno.numeroCuenta").value("012345678901234567"))
                .andExpect(jsonPath("$.parametrosEntorno.telefonoContacto").value("6671234567"));
    }

    @Test
    @DisplayName("Renderizado de plantillas sustituye parámetros dinámicos y variables de entorno")
    void renderTemplatesSubstitutesPlaceholders() throws Exception {
        Map<String, Object> reqAprob = Map.of(
                "codigo", "APROBACION",
                "parametros", Map.of("folio", "CMP-0099")
        );

        mockMvc.perform(post("/api/v1/revision/plantillas/render")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqAprob)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value(org.hamcrest.Matchers.containsString("012345678901234567")))
                .andExpect(jsonPath("$.mensaje").value(org.hamcrest.Matchers.containsString("CMP-0099")))
                .andExpect(jsonPath("$.mensaje").value(org.hamcrest.Matchers.containsString("$5000 mxn")));

        Map<String, Object> reqObs = Map.of(
                "codigo", "OBSERVACION_DOCUMENTO",
                "parametros", Map.of(
                        "nombreCliente", "Ana López",
                        "folio", "CMP-0100",
                        "campoDocumento", "Comprobante de domicilio",
                        "detalleInconveniente", "el archivo está borroso"
                )
        );

        mockMvc.perform(post("/api/v1/revision/plantillas/render")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqObs)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value(org.hamcrest.Matchers.containsString("Hola Ana López.")))
                .andExpect(jsonPath("$.mensaje").value(org.hamcrest.Matchers.containsString("Comprobante de domicilio")))
                .andExpect(jsonPath("$.mensaje").value(org.hamcrest.Matchers.containsString("el archivo está borroso")));
    }

    @Test
    @DisplayName("Cambio de estatus a RECHAZADO envía plantilla de rechazo y bloquea login con alerta de rechazo")
    void rejectedRequestSendsTemplateAndLoginReturnsRejectedFlag() throws Exception {
        String email = "rechazado-test@subasta.mx";
        Usuario u = new Usuario(null, email, passwordEncoder.encode("Secret123!"), "COMPRADOR", false, LocalDateTime.now());
        u.setTelefono("6679990001");
        u = usuarioRepository.save(u);

        Comprador c = new Comprador();
        c.setFolio("CMP-7001");
        c.setUsuarioId(u.getId());
        c.setEmail(email);
        c.setTelefono("6679990001");
        c.setTipoPersona("FISICA");
        c.setNombres("Carlos");
        c.setCalle("Av. Reforma 1");
        c.setCodigoPostal("80000");
        c.setEstado("Sinaloa");
        c = compradorRepository.save(c);

        mockMvc.perform(put("/api/v1/revision/solicitudes/COMPRADOR/" + c.getId() + "/estatus")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "estatus", "RECHAZADO",
                                "templateCode", "RECHAZO_DIRECTO"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estatus").value("RECHAZADO"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "identifier", email,
                                "password", "Secret123!"
                        ))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.rejected").value(true))
                .andExpect(jsonPath("$.estatus").value("RECHAZADO"))
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("no fue aprobado")));
    }

    @Test
    @DisplayName("Auto-rechazo después de 2 semanas sin actualización rechaza solicitud vencida y respeta recientes")
    void autoRejectionRejectsOnlyExpiredRequests() {
        String expiredEmail = "expirado-2w@subasta.mx";
        Usuario expiredUser = new Usuario(null, expiredEmail, passwordEncoder.encode("Secret123!"), "COMPRADOR", false, LocalDateTime.now().minusDays(20));
        expiredUser.setTelefono("6679990002");
        expiredUser = usuarioRepository.save(expiredUser);

        Comprador expiredComp = new Comprador();
        expiredComp.setFolio("CMP-7002");
        expiredComp.setUsuarioId(expiredUser.getId());
        expiredComp.setEmail(expiredEmail);
        expiredComp.setTelefono("6679990002");
        expiredComp.setTipoPersona("FISICA");
        expiredComp.setNombres("Laura");
        expiredComp.setCalle("Calle 1");
        expiredComp.setCodigoPostal("80000");
        expiredComp.setEstado("Sinaloa");
        expiredComp.setEstatus("EN_REVISION");
        expiredComp.setFechaCreacion(LocalDateTime.now().minusDays(16));
        expiredComp.setFechaActualizacion(LocalDateTime.now().minusDays(15));
        expiredComp = compradorRepository.save(expiredComp);

        String recentEmail = "reciente-2w@subasta.mx";
        Usuario recentUser = new Usuario(null, recentEmail, passwordEncoder.encode("Secret123!"), "COMPRADOR", false, LocalDateTime.now().minusDays(2));
        recentUser.setTelefono("6679990003");
        recentUser = usuarioRepository.save(recentUser);

        Comprador recentComp = new Comprador();
        recentComp.setFolio("CMP-7003");
        recentComp.setUsuarioId(recentUser.getId());
        recentComp.setEmail(recentEmail);
        recentComp.setTelefono("6679990003");
        recentComp.setTipoPersona("FISICA");
        recentComp.setNombres("Pedro");
        recentComp.setCalle("Calle 2");
        recentComp.setCodigoPostal("80000");
        recentComp.setEstado("Sinaloa");
        recentComp.setEstatus("EN_REVISION");
        recentComp.setFechaCreacion(LocalDateTime.now().minusDays(20));
        recentComp.setFechaActualizacion(LocalDateTime.now().minusDays(2));
        recentComp = compradorRepository.save(recentComp);

        int count = requestExpirationService.rejectExpiredRequests();
        assertThat(count).isGreaterThanOrEqualTo(1);

        Comprador reloadedExpired = compradorRepository.findById(expiredComp.getId()).orElseThrow();
        Comprador reloadedRecent = compradorRepository.findById(recentComp.getId()).orElseThrow();

        assertThat(reloadedExpired.getEstatus()).isEqualTo("RECHAZADO");
        assertThat(reloadedRecent.getEstatus()).isEqualTo("EN_REVISION");
    }

    @Test
    @DisplayName("Registro con teléfono duplicado en distinto correo debe devolver 409 Conflict")
    void duplicatePhoneRegistrationReturnsConflict() throws Exception {
        String phone = "6678887766";
        Usuario existing = new Usuario(null, "tel-uno@subasta.mx", passwordEncoder.encode("Secret123!"), "COMPRADOR", false, LocalDateTime.now());
        existing.setTelefono(phone);
        usuarioRepository.save(existing);

        String verifiedToken = jwtService.createVerifiedEmailToken("tel-dos@subasta.mx");
        Map<String, Object> dto = Map.of(
                "email", "tel-dos@subasta.mx",
                "verifiedEmailToken", verifiedToken,
                "password", "Secret123!",
                "telefono", phone,
                "tipoPersona", "FISICA",
                "nombres", "Mario",
                "calle", "Av. Insurgentes 10",
                "codigoPostal", "80000",
                "estado", "Sinaloa"
        );

        MockMultipartFile datosPart = new MockMultipartFile(
                "datos",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(dto)
        );

        mockMvc.perform(multipart("/api/v1/onboarding/buyer").file(datosPart))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("teléfono")));
    }
}

