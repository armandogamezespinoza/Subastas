package com.subasta.subasta_backend;

import com.subasta.entity.Comprador;
import com.subasta.entity.Documento;
import com.subasta.entity.Usuario;
import com.subasta.repository.CompradorRepository;
import com.subasta.repository.DocumentoRepository;
import com.subasta.repository.UsuarioRepository;
import com.subasta.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DocumentSecurityIdorTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DocumentoRepository documentoRepository;

    @Autowired
    private CompradorRepository compradorRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Documento testDoc;
    private Comprador ownerComprador;

    @BeforeEach
    void setUp() {
        documentoRepository.deleteAll();
        compradorRepository.deleteAll();
        usuarioRepository.deleteAll();

        // 1. Crear usuario propietario
        Usuario ownerUser = new Usuario(null, "owner@subasta.mx", passwordEncoder.encode("Pass123!"), "COMPRADOR", true, LocalDateTime.now());
        ownerUser = usuarioRepository.save(ownerUser);

        // 2. Crear registro Comprador asociado
        ownerComprador = new Comprador();
        ownerComprador.setFolio("CMP-0001");
        ownerComprador.setEmail("owner@subasta.mx");
        ownerComprador.setTelefono("6671000001");
        ownerComprador.setNombres("Juan");
        ownerComprador.setApellidoPaterno("Propietario");
        ownerComprador.setTipoPersona("FISICA");
        ownerComprador.setEstado("Sinaloa");
        ownerComprador.setCalle("Calle 1");
        ownerComprador.setCodigoPostal("80000");
        ownerComprador.setUsuarioId(ownerUser.getId());
        ownerComprador = compradorRepository.save(ownerComprador);

        // 3. Crear documento ligado a este Comprador
        testDoc = new Documento("COMPRADOR", ownerComprador.getId(), "INE_IFE", "ine_privada.pdf", "/app/uploads/ine_privada.pdf");
        testDoc = documentoRepository.save(testDoc);
    }

    @Test
    @DisplayName("VULN-01: Petición no autenticada a documento debe retornar 401 o 403 (Denegado)")
    void testUnauthenticatedUserCannotAccessDocument() throws Exception {
        mockMvc.perform(get("/api/v1/revision/documentos/" + testDoc.getId() + "/view"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/revision/documentos/" + testDoc.getId() + "/download"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("VULN-01: Usuario no propietario (IDOR) debe recibir 403 Forbidden")
    void testNonOwnerUserCannotAccessOtherUsersDocument() throws Exception {
        // Crear usuario atacante / tercero
        Usuario attacker = new Usuario(null, "attacker@subasta.mx", passwordEncoder.encode("Pass123!"), "COMPRADOR", true, LocalDateTime.now());
        usuarioRepository.save(attacker);

        String attackerToken = jwtService.createAccessToken("attacker@subasta.mx", "COMPRADOR");

        mockMvc.perform(get("/api/v1/revision/documentos/" + testDoc.getId() + "/view")
                        .header("Authorization", "Bearer " + attackerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/revision/documentos/" + testDoc.getId() + "/download")
                        .header("Authorization", "Bearer " + attackerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("VULN-01: Usuario legítimo propietario puede acceder a su propio documento (200 OK)")
    void testOwnerUserCanAccessOwnDocument() throws Exception {
        String ownerToken = jwtService.createAccessToken("owner@subasta.mx", "COMPRADOR");

        mockMvc.perform(get("/api/v1/revision/documentos/" + testDoc.getId() + "/view")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/revision/documentos/" + testDoc.getId() + "/download")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("VULN-01: Administrador o Aprobador tiene acceso legítimo a cualquier expediente (200 OK)")
    void testAdminAndAprobadorCanAccessAnyDocument() throws Exception {
        String aprobadorToken = jwtService.createAccessToken("aprobador@subasta.mx", "APROBADOR");
        String adminToken = jwtService.createAccessToken("admin@subasta.mx", "ADMINISTRADOR");

        mockMvc.perform(get("/api/v1/revision/documentos/" + testDoc.getId() + "/view")
                        .header("Authorization", "Bearer " + aprobadorToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/revision/documentos/" + testDoc.getId() + "/view")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }
}

