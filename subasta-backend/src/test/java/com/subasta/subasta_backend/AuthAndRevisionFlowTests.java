package com.subasta.subasta_backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.subasta.entity.Comprador;
import com.subasta.entity.Usuario;
import com.subasta.repository.CompradorRepository;
import com.subasta.repository.UsuarioRepository;
import com.subasta.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthAndRevisionFlowTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CompradorRepository compradorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        compradorRepository.deleteAll();
        usuarioRepository.deleteAll();
    }

    @Test
    void testAprobadorRoleIsValid() {
        Usuario aprobador = new Usuario(null, "aprobador@subasta.mx", passwordEncoder.encode("Secret123!"), "APROBADOR", true, LocalDateTime.now());
        Usuario saved = usuarioRepository.save(aprobador);
        assertThat(saved.getRol()).isEqualTo("APROBADOR");
    }

    @Test
    void testPasswordLoginWithEmail() throws Exception {
        Usuario user = new Usuario();
        user.setEmail("comprador@subasta.mx");
        user.setPassword(passwordEncoder.encode("Password123!"));
        user.setRol("COMPRADOR");
        user.setTelefono("6671234567");
        user.setActivo(true);
        usuarioRepository.save(user);

        Map<String, String> loginRequest = Map.of(
                "identifier", "comprador@subasta.mx",
                "password", "Password123!"
        );

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("comprador@subasta.mx"));
    }

    @Test
    void testPasswordLoginWithPhone() throws Exception {
        Usuario user = new Usuario();
        user.setEmail("postor@subasta.mx");
        user.setPassword(passwordEncoder.encode("Password123!"));
        user.setRol("COMPRADOR");
        user.setTelefono("6679876543");
        user.setActivo(true);
        usuarioRepository.save(user);

        Map<String, String> loginRequest = Map.of(
                "identifier", "6679876543",
                "password", "Password123!"
        );

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("postor@subasta.mx"));
    }

    @Test
    void testUpdateStatusToRecibidoActivatesAccount() throws Exception {
        Usuario user = new Usuario();
        user.setEmail("nuevo@subasta.mx");
        user.setPassword(passwordEncoder.encode("Password123!"));
        user.setRol("COMPRADOR");
        user.setActivo(false); // Inactive initially
        Usuario savedUser = usuarioRepository.save(user);

        Comprador comprador = new Comprador();
        comprador.setFolio("CMP-0099");
        comprador.setEmail("nuevo@subasta.mx");
        comprador.setTelefono("6671112233");
        comprador.setNombres("Juan");
        comprador.setApellidoPaterno("Pérez");
        comprador.setTipoPersona("FISICA");
        comprador.setRfc("PEPJ900101AB1");
        comprador.setEstado("Sinaloa");
        comprador.setCiudad("Culiacán");
        comprador.setCodigoPostal("80000");
        comprador.setColonia("Centro");
        comprador.setCalle("Av Álvaro Obregón 100");
        comprador.setUsuarioId(savedUser.getId());
        comprador.setEstatus("NO_RECIBIDO");
        Comprador savedComprador = compradorRepository.save(comprador);

        // Access token for APROBADOR
        String token = jwtService.createAccessToken("admin@subasta.mx", "APROBADOR");

        // Change status to RECIBIDO
        Map<String, String> updateReq = Map.of("estatus", "RECIBIDO");

        mockMvc.perform(put("/api/v1/revision/solicitudes/COMPRADOR/" + savedComprador.getId() + "/estatus")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.estatus").value("RECIBIDO"));

        // Verify account is now active
        Usuario reloadedUser = usuarioRepository.findById(savedUser.getId()).orElseThrow();
        assertThat(reloadedUser.getActivo()).isTrue();
    }
}
