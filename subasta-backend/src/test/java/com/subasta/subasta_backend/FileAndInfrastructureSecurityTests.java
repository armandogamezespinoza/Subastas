package com.subasta.subasta_backend;

import com.subasta.exception.UnsupportedMediaTypeException;
import com.subasta.service.FileStorageService;
import com.subasta.service.FileValidationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class FileAndInfrastructureSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FileValidationService fileValidationService;

    @Autowired
    private FileStorageService fileStorageService;

    @Test
    @DisplayName("SEC-01: Health check público retorna status UP con 200 OK")
    void testHealthEndpointReturnsUp() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("SEC-02: Security Headers deben incluir X-Frame-Options SAMEORIGIN y X-Content-Type-Options nosniff")
    void testSecurityHeadersPresent() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(header().string("X-Frame-Options", "SAMEORIGIN"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test
    @DisplayName("SEC-03: Rechazo de archivos con extensión no permitida (.exe, .sh, .jsp)")
    void testRejectInvalidExtension() {
        MockMultipartFile badFile = new MockMultipartFile(
                "file",
                "malware.exe",
                "application/octet-stream",
                "MZ executable header".getBytes()
        );

        assertThatThrownBy(() -> fileValidationService.validate(badFile))
                .isInstanceOf(UnsupportedMediaTypeException.class)
                .hasMessageContaining("Extensión no permitida");
    }

    @Test
    @DisplayName("SEC-04: Detección profunda de Magic Bytes (Tika): Archivo ejecutable camuflado como .pdf es rechazado")
    void testRejectSpoofedPdfWithExecutableContent() {
        // Archivo que se llama exploit.pdf pero su contenido es un script o texto no binario PDF
        byte[] fakeContent = "<script>alert('xss')</script>".getBytes();
        MockMultipartFile spoofedFile = new MockMultipartFile(
                "file",
                "exploit.pdf",
                "application/pdf",
                fakeContent
        );

        assertThatThrownBy(() -> fileValidationService.validate(spoofedFile))
                .isInstanceOf(UnsupportedMediaTypeException.class)
                .hasMessageContaining("Contenido de archivo no permitido");
    }

    @Test
    @DisplayName("SEC-05: Aceptación de archivo PDF legítimo verificado por Magic Bytes (%PDF-)")
    void testAcceptValidPdf() {
        byte[] validPdfHeader = "%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF".getBytes();
        MockMultipartFile validPdf = new MockMultipartFile(
                "file",
                "documento_oficial.pdf",
                "application/pdf",
                validPdfHeader
        );

        fileValidationService.validate(validPdf);
        String savedPath = fileStorageService.saveFile(validPdf, "TEST_VALID");
        assertThat(savedPath).isNotBlank();
    }

    @Test
    @DisplayName("SEC-06: Mitigación de Path Traversal en resolveFile(): No permite escapar del directorio de uploads")
    void testPreventPathTraversalInResolveFile() {
        // Intento de escapar hacia /etc/passwd o con secuencias ../../
        Path resolvedPasswd = fileStorageService.resolveFile("/etc/passwd");
        assertThat(resolvedPasswd).isNull();

        Path resolvedTraversal = fileStorageService.resolveFile("../../etc/shadow");
        assertThat(resolvedTraversal).isNull();

        Path resolvedRelative = fileStorageService.resolveFile("..\\..\\windows\\system32\\calc.exe");
        assertThat(resolvedRelative).isNull();
    }

    @Test
    @DisplayName("SEC-07: Rate Limiting / Cooldown en /send-code: 2da solicitud consecutiva retorna 429 Too Many Requests")
    void testSendCodeRateLimitingCooldown() throws Exception {
        String testEmail = "cooldown-test@subasta.mx";
        String requestJson = "{\"email\":\"" + testEmail + "\"}";

        // 1er envío exitoso
        mockMvc.perform(post("/api/v1/auth/send-code")
                        .contentType("application/json")
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 2do envío inmediato debe ser bloqueado con HTTP 429 Too Many Requests
        mockMvc.perform(post("/api/v1/auth/send-code")
                        .contentType("application/json")
                        .content(requestJson))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error", org.hamcrest.Matchers.containsString("espera")));
    }
}
