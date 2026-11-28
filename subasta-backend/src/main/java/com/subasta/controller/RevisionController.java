package com.subasta.controller;

import com.subasta.entity.Comprador;
import com.subasta.entity.Documento;
import com.subasta.entity.Vendedor;
import com.subasta.repository.CompradorRepository;
import com.subasta.repository.DocumentoRepository;
import com.subasta.repository.VendedorRepository;
import com.subasta.service.EmailService;
import com.subasta.service.EmailTemplateService;
import com.subasta.service.FileStorageService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/revision")
public class RevisionController {

    private final CompradorRepository compradorRepository;
    private final VendedorRepository vendedorRepository;
    private final DocumentoRepository documentoRepository;
    private final FileStorageService fileStorageService;
    private final com.subasta.repository.UsuarioRepository usuarioRepository;
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;

    public RevisionController(CompradorRepository compradorRepository,
                              VendedorRepository vendedorRepository,
                              DocumentoRepository documentoRepository,
                              FileStorageService fileStorageService,
                              com.subasta.repository.UsuarioRepository usuarioRepository,
                              EmailService emailService,
                              EmailTemplateService emailTemplateService) {
        this.compradorRepository = compradorRepository;
        this.vendedorRepository = vendedorRepository;
        this.documentoRepository = documentoRepository;
        this.fileStorageService = fileStorageService;
        this.usuarioRepository = usuarioRepository;
        this.emailService = emailService;
        this.emailTemplateService = emailTemplateService;
    }

    @GetMapping("/kpis")
    public ResponseEntity<?> getKpis() {
        List<Comprador> compradores = compradorRepository.findAll();
        List<Vendedor> vendedores = vendedorRepository.findAll();

        long totalCompradores = compradores.size();
        long totalVendedores = vendedores.size();
        long total = totalCompradores + totalVendedores;

        long aprobados = 0;
        long rechazados = 0;
        long enRevision = 0;
        long enviados = 0;

        for (Comprador c : compradores) {
            String status = c.getEstatus() != null ? c.getEstatus() : "ENVIADO";
            switch (status) {
                case "APROBADO" -> aprobados++;
                case "RECHAZADO" -> rechazados++;
                case "EN_REVISION" -> enRevision++;
                default -> enviados++;
            }
        }

        for (Vendedor v : vendedores) {
            String status = v.getEstatus() != null ? v.getEstatus() : "ENVIADO";
            switch (status) {
                case "APROBADO" -> aprobados++;
                case "RECHAZADO" -> rechazados++;
                case "EN_REVISION" -> enRevision++;
                default -> enviados++;
            }
        }

        return ResponseEntity.ok(Map.of(
                "totalCompradores", totalCompradores,
                "totalVendedores", totalVendedores,
                "total", total,
                "aprobados", aprobados,
                "rechazados", rechazados,
                "enRevision", enRevision,
                "enviados", enviados
        ));
    }

    @GetMapping("/solicitudes")
    public ResponseEntity<?> getSolicitudes(@RequestParam(value = "tipo", required = false) String tipo,
                                           @RequestParam(value = "estatus", required = false) String estatus) {
        List<Map<String, Object>> result = new ArrayList<>();

        boolean includeCompradores = tipo == null || tipo.isBlank() || "COMPRADOR".equalsIgnoreCase(tipo);
        boolean includeVendedores = tipo == null || tipo.isBlank() || "VENDEDOR".equalsIgnoreCase(tipo);

        if (includeCompradores) {
            for (Comprador c : compradorRepository.findAll()) {
                String cEstatus = c.getEstatus() != null ? c.getEstatus() : "ENVIADO";
                if (estatus != null && !estatus.isBlank() && !estatus.equalsIgnoreCase(cEstatus)) {
                    continue;
                }
                String nombreCompleto = c.getRazonSocial() != null && !c.getRazonSocial().isBlank()
                        ? c.getRazonSocial()
                        : String.join(" ", Arrays.asList(c.getNombres(), c.getApellidoPaterno(), c.getApellidoMaterno())
                                .stream().filter(s -> s != null && !s.isBlank()).toList());

                long totalDocs = documentoRepository.findByTipoUsuarioAndRegistroId("COMPRADOR", c.getId()).size();

                Map<String, Object> item = new HashMap<>();
                item.put("id", c.getId());
                item.put("folio", c.getFolio() != null ? c.getFolio() : String.format("CMP-%04d", c.getId()));
                item.put("tipo", "COMPRADOR");
                item.put("tipoPersona", c.getTipoPersona());
                item.put("nombre", nombreCompleto);
                item.put("rfc", c.getRfc());
                item.put("email", c.getEmail());
                item.put("telefono", c.getTelefono());
                item.put("estatus", cEstatus);
                item.put("fechaCreacion", c.getFechaCreacion());
                item.put("totalDocumentos", totalDocs);
                result.add(item);
            }
        }

        if (includeVendedores) {
            for (Vendedor v : vendedorRepository.findAll()) {
                String vEstatus = v.getEstatus() != null ? v.getEstatus() : "ENVIADO";
                if (estatus != null && !estatus.isBlank() && !estatus.equalsIgnoreCase(vEstatus)) {
                    continue;
                }
                String nombreCompleto = v.getRazonSocial() != null && !v.getRazonSocial().isBlank()
                        ? v.getRazonSocial()
                        : String.join(" ", Arrays.asList(v.getNombres(), v.getApellidoPaterno(), v.getApellidoMaterno())
                                .stream().filter(s -> s != null && !s.isBlank()).toList());

                long totalDocs = documentoRepository.findByTipoUsuarioAndRegistroId("VENDEDOR", v.getId()).size();

                Map<String, Object> item = new HashMap<>();
                item.put("id", v.getId());
                item.put("folio", v.getFolio() != null ? v.getFolio() : String.format("VND-%04d", v.getId()));
                item.put("tipo", "VENDEDOR");
                item.put("tipoPersona", v.getTipoPersona());
                item.put("nombre", nombreCompleto);
                item.put("rfc", v.getRfc());
                item.put("email", v.getEmail());
                item.put("telefono", v.getTelefono());
                item.put("estatus", vEstatus);
                item.put("fechaCreacion", v.getFechaCreacion());
                item.put("totalDocumentos", totalDocs);
                result.add(item);
            }
        }

        // Sort descending by fechaCreacion
        result.sort((a, b) -> {
            Comparable fa = (Comparable) a.get("fechaCreacion");
            Comparable fb = (Comparable) b.get("fechaCreacion");
            if (fa == null) return 1;
            if (fb == null) return -1;
            return fb.compareTo(fa);
        });

        return ResponseEntity.ok(result);
    }

    @GetMapping("/solicitudes/{tipo}/{id}")
    public ResponseEntity<?> getSolicitudDetail(@PathVariable("tipo") String tipo, @PathVariable("id") Long id) {
        String normalizedTipo = tipo.toUpperCase();
        Map<String, Object> response = new HashMap<>();

        if ("COMPRADOR".equals(normalizedTipo)) {
            Optional<Comprador> compradorOpt = compradorRepository.findById(id);
            if (compradorOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Comprador c = compradorOpt.get();
            response.put("id", c.getId());
            response.put("folio", c.getFolio());
            response.put("tipo", "COMPRADOR");
            response.put("estatus", c.getEstatus() != null ? c.getEstatus() : "ENVIADO");
            response.put("fechaCreacion", c.getFechaCreacion());
            response.put("datos", c);
        } else if ("VENDEDOR".equals(normalizedTipo)) {
            Optional<Vendedor> vendedorOpt = vendedorRepository.findById(id);
            if (vendedorOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Vendedor v = vendedorOpt.get();
            response.put("id", v.getId());
            response.put("folio", v.getFolio());
            response.put("tipo", "VENDEDOR");
            response.put("estatus", v.getEstatus() != null ? v.getEstatus() : "ENVIADO");
            response.put("fechaCreacion", v.getFechaCreacion());
            response.put("datos", v);
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Tipo no válido. Use COMPRADOR o VENDEDOR"));
        }

        List<Documento> docs = documentoRepository.findByTipoUsuarioAndRegistroId(normalizedTipo, id);
        List<Map<String, Object>> docsPayload = docs.stream().map(doc -> {
            Map<String, Object> docMap = new HashMap<>();
            docMap.put("id", doc.getId());
            docMap.put("tipoDocumento", doc.getTipoDocumento());
            docMap.put("nombreArchivo", doc.getNombreArchivo());
            docMap.put("fechaSubida", doc.getFechaSubida());
            docMap.put("previewUrl", "/api/v1/revision/documentos/" + doc.getId() + "/view");
            docMap.put("downloadUrl", "/api/v1/revision/documentos/" + doc.getId() + "/download");
            return docMap;
        }).collect(Collectors.toList());

        response.put("documentos", docsPayload);
        response.put("totalDocumentos", docsPayload.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/plantillas")
    public ResponseEntity<?> getEmailTemplates() {
        return ResponseEntity.ok(Map.of(
                "plantillas", emailTemplateService.getAllTemplates(),
                "parametrosEntorno", emailTemplateService.getEnvironmentDefaults()
        ));
    }

    @PostMapping("/plantillas/render")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> renderEmailTemplate(@RequestBody Map<String, Object> body) {
        String codigo = body.get("codigo") != null ? String.valueOf(body.get("codigo")) : null;
        Map<String, String> params = extractParams(body.get("parametros"));
        return ResponseEntity.ok(emailTemplateService.renderTemplate(codigo, params));
    }

    @PostMapping("/plantillas/enviar")
    public ResponseEntity<?> sendEmailFromTemplate(@RequestBody Map<String, Object> body) {
        String toEmail = body.get("toEmail") != null ? String.valueOf(body.get("toEmail")).trim() : null;
        String codigo = body.get("codigo") != null ? String.valueOf(body.get("codigo")).trim() : null;
        String customSubject = body.get("asunto") != null ? String.valueOf(body.get("asunto")) : null;
        String customBody = body.get("mensaje") != null ? String.valueOf(body.get("mensaje")) : null;

        if (toEmail == null || toEmail.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El correo destinatario es obligatorio"));
        }

        Map<String, String> params = extractParams(body.get("parametros"));
        emailTemplateService.sendTemplatedEmail(toEmail, codigo, params, customSubject, customBody);
        return ResponseEntity.ok(Map.of("success", true, "mensaje", "Correo enviado correctamente"));
    }

    @PutMapping("/solicitudes/{tipo}/{id}/estatus")
    public ResponseEntity<?> updateEstatus(@PathVariable("tipo") String tipo,
                                          @PathVariable("id") Long id,
                                          @RequestBody Map<String, Object> body) {
        Object rawEstatusObj = body.get("estatus");
        String rawEstatus = rawEstatusObj != null ? String.valueOf(rawEstatusObj) : null;
        if (rawEstatus == null || rawEstatus.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El campo estatus es obligatorio"));
        }

        String nuevoEstatus = rawEstatus.trim().toUpperCase();
        String normalizedTipo = tipo.toUpperCase();
        if ("COMPRADOR".equals(normalizedTipo)) {
            Optional<Comprador> compradorOpt = compradorRepository.findById(id);
            if (compradorOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Comprador c = compradorOpt.get();
            c.setEstatus(nuevoEstatus);
            c.setFechaActualizacion(java.time.LocalDateTime.now());
            compradorRepository.save(c);

            syncUsuarioStatus(c.getUsuarioId(), nuevoEstatus);
            String nombre = resolveNombreSolicitante(c.getNombres(), c.getRazonSocial());
            dispatchStatusNotification(c.getEmail(), nombre, c.getFolio(), nuevoEstatus, body);

            return ResponseEntity.ok(Map.of("success", true, "estatus", nuevoEstatus, "mensaje", "Estado de comprador actualizado correctamente"));
        } else if ("VENDEDOR".equals(normalizedTipo)) {
            Optional<Vendedor> vendedorOpt = vendedorRepository.findById(id);
            if (vendedorOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Vendedor v = vendedorOpt.get();
            v.setEstatus(nuevoEstatus);
            v.setFechaActualizacion(java.time.LocalDateTime.now());
            vendedorRepository.save(v);

            syncUsuarioStatus(v.getUsuarioId(), nuevoEstatus);
            String nombre = resolveNombreSolicitante(v.getNombres(), v.getRazonSocial());
            dispatchStatusNotification(v.getEmail(), nombre, v.getFolio(), nuevoEstatus, body);

            return ResponseEntity.ok(Map.of("success", true, "estatus", nuevoEstatus, "mensaje", "Estado de vendedor actualizado correctamente"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Tipo no válido"));
        }
    }

    private void syncUsuarioStatus(Long usuarioId, String nuevoEstatus) {
        if (usuarioId == null) {
            return;
        }
        usuarioRepository.findById(usuarioId).ifPresent(u -> {
            u.setEstatus(nuevoEstatus);
            if ("RECIBIDO".equalsIgnoreCase(nuevoEstatus) || "APROBADO".equalsIgnoreCase(nuevoEstatus)) {
                u.setActivo(true);
            } else if ("NEGADO".equalsIgnoreCase(nuevoEstatus) || "RECHAZADO".equalsIgnoreCase(nuevoEstatus)) {
                u.setActivo(false);
            }
            usuarioRepository.save(u);
        });
    }

    private String resolveNombreSolicitante(String nombres, String razonSocial) {
        if (nombres != null && !nombres.isBlank()) {
            return nombres.trim();
        }
        if (razonSocial != null && !razonSocial.isBlank()) {
            return razonSocial.trim();
        }
        return "Usuario";
    }

    private void dispatchStatusNotification(String email, String nombre, String folio, String nuevoEstatus, Map<String, Object> body) {
        if (email == null || email.isBlank()) {
            return;
        }
        String customMessage = body.get("mensaje") != null ? String.valueOf(body.get("mensaje")) : null;
        String customSubject = body.get("asunto") != null ? String.valueOf(body.get("asunto")) : null;
        String templateCode = body.get("templateCode") != null ? String.valueOf(body.get("templateCode")).trim() : null;

        Map<String, String> params = new HashMap<>(extractParams(body.get("parametros")));
        params.putIfAbsent("nombreCliente", nombre);
        params.putIfAbsent("folio", folio != null ? folio : "");

        if (templateCode == null || templateCode.isBlank()) {
            if ("APROBADO".equalsIgnoreCase(nuevoEstatus)) {
                templateCode = EmailTemplateService.TEMPLATE_APROBACION;
            } else if ("RECHAZADO".equalsIgnoreCase(nuevoEstatus) || "NEGADO".equalsIgnoreCase(nuevoEstatus)) {
                templateCode = EmailTemplateService.TEMPLATE_RECHAZO_DIRECTO;
            }
        }

        if (templateCode != null && !templateCode.isBlank()) {
            emailTemplateService.sendTemplatedEmail(email, templateCode, params, customSubject, customMessage);
        } else if (customMessage != null && !customMessage.isBlank()) {
            String subject = (customSubject != null && !customSubject.isBlank())
                    ? customSubject
                    : "Actualización de tu solicitud — SUBASTA";
            emailService.sendCustomEmail(email, subject, customMessage);
        }
    }

    private Map<String, String> extractParams(Object rawParams) {
        Map<String, String> params = new HashMap<>();
        if (rawParams instanceof Map<?, ?> map) {
            map.forEach((k, v) -> {
                if (k != null && v != null) {
                    params.put(String.valueOf(k), String.valueOf(v));
                }
            });
        }
        return params;
    }

    /**
     * Endpoint exclusivo para APROBADOR y ADMINISTRADOR:
     * Cambia el rol de un usuario entre COMPRADOR y VENDEDOR.
     * Solo se permiten los roles destino: COMPRADOR o VENDEDOR.
     */
    @PutMapping("/usuarios/{id}/rol")
    public ResponseEntity<?> cambiarRolUsuario(@PathVariable("id") Long id,
                                               @RequestBody Map<String, String> body) {
        String nuevoRol = body.get("rol");
        if (nuevoRol == null || nuevoRol.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El campo rol es obligatorio"));
        }

        String rolNormalizado = nuevoRol.trim().toUpperCase();
        if (!"COMPRADOR".equals(rolNormalizado) && !"VENDEDOR".equals(rolNormalizado)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "El Aprobador solo puede cambiar el rol entre COMPRADOR y VENDEDOR"
            ));
        }

        return usuarioRepository.findById(id)
                .map(u -> {
                    String rolActual = u.getRol();
                    u.setRol(rolNormalizado);
                    usuarioRepository.save(u);
                    return ResponseEntity.ok(Map.<String, Object>of(
                            "success", true,
                            "rolAnterior", rolActual,
                            "rolNuevo", rolNormalizado,
                            "mensaje", "Rol actualizado de " + rolActual + " a " + rolNormalizado
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/documentos/{id}/view")
    public ResponseEntity<Resource> viewDocument(@PathVariable("id") Long id) {
        return serveDocument(id, false);
    }

    @GetMapping("/documentos/{id}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable("id") Long id) {
        return serveDocument(id, true);
    }

    private boolean isAuthorizedToAccessDocument(Documento doc, Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return false;
        }

        // Roles administrativos tienen acceso total a todos los expedientes
        boolean isStaff = auth.getAuthorities().stream().anyMatch(a -> {
            String role = a.getAuthority();
            return "ROLE_ADMINISTRADOR".equals(role) || "ROLE_ADMIN".equals(role)
                    || "ROLE_APROBADOR".equals(role) || "ROLE_CONTROLER".equals(role);
        });
        if (isStaff) {
            return true;
        }

        if (doc == null) {
            return false;
        }

        String currentUserEmail = auth.getName();
        if (currentUserEmail == null || currentUserEmail.isBlank()) {
            return false;
        }

        // Validación estricta de propiedad de recurso (Anti-IDOR / Anti-BOLA)
        if ("COMPRADOR".equalsIgnoreCase(doc.getTipoUsuario())) {
            return compradorRepository.findById(doc.getRegistroId())
                    .map(c -> currentUserEmail.equalsIgnoreCase(c.getEmail()))
                    .orElse(false);
        } else if ("VENDEDOR".equalsIgnoreCase(doc.getTipoUsuario())) {
            return vendedorRepository.findById(doc.getRegistroId())
                    .map(v -> currentUserEmail.equalsIgnoreCase(v.getEmail()))
                    .orElse(false);
        }

        return false;
    }

    private ResponseEntity<Resource> serveDocument(Long id, boolean asDownload) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<Documento> docOpt = documentoRepository.findById(id);
        if (docOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Documento doc = docOpt.get();
        if (!isAuthorizedToAccessDocument(doc, auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String filename = (doc.getNombreArchivo() != null && !doc.getNombreArchivo().isBlank())
                ? doc.getNombreArchivo()
                : "Documento #" + id + ".pdf";
        Path filePath = (doc.getRutaArchivo() != null)
                ? fileStorageService.resolveFile(doc.getRutaArchivo())
                : null;

        if (filePath == null) {
            if (asDownload) {
                byte[] message = ("El archivo '" + filename + "' no se encuentra en el almacenamiento actual del contenedor porque fue subido antes de montar el volumen persistente de Docker.\n\nLas nuevas solicitudes conservarán sus archivos permanentemente en el volumen 'backend_uploads'.").getBytes(StandardCharsets.UTF_8);
                return ResponseEntity.ok()
                        .contentType(MediaType.TEXT_PLAIN)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + ".txt\"")
                        .body(new ByteArrayResource(message));
            } else {
                String svg = "<svg xmlns='http://www.w3.org/2000/svg' width='700' height='400' viewBox='0 0 700 400'>"
                        + "<rect width='700' height='400' fill='#0B0E14'/>"
                        + "<rect x='20' y='20' width='660' height='360' rx='16' fill='#131722' stroke='#1E2638' stroke-width='1.5'/>"
                        + "<circle cx='350' cy='140' r='36' fill='#192233'/>"
                        + "<path d='M350 120v30M350 160h.01' stroke='#FF5A1E' stroke-width='3' stroke-linecap='round'/>"
                        + "<text x='350' y='210' text-anchor='middle' font-family='system-ui, -apple-system, sans-serif' font-size='18' font-weight='600' fill='#F8FAFC'>Expediente Digital de Subasta</text>"
                        + "<text x='350' y='240' text-anchor='middle' font-family='system-ui, -apple-system, sans-serif' font-size='13' fill='#94A3B8'>" + filename + "</text>"
                        + "<text x='350' y='275' text-anchor='middle' font-family='system-ui, -apple-system, sans-serif' font-size='12' fill='#64748B'>Archivo registrado y disponible en el sistema.</text>"
                        + "</svg>";
                return ResponseEntity.ok()
                        .contentType(MediaType.valueOf("image/svg+xml"))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + ".svg\"")
                        .body(new ByteArrayResource(svg.getBytes(StandardCharsets.UTF_8)));
            }
        }

        File file = filePath.toFile();
        Resource resource = new FileSystemResource(file);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        try {
            String mimeType = Files.probeContentType(filePath);
            if (mimeType != null) {
                mediaType = MediaType.parseMediaType(mimeType);
            } else {
                String fn = (doc != null && doc.getNombreArchivo() != null)
                        ? doc.getNombreArchivo().toLowerCase()
                        : filename.toLowerCase();
                if (fn.endsWith(".pdf")) mediaType = MediaType.APPLICATION_PDF;
                else if (fn.endsWith(".png")) mediaType = MediaType.IMAGE_PNG;
                else if (fn.endsWith(".jpg") || fn.endsWith(".jpeg")) mediaType = MediaType.IMAGE_JPEG;
                else if (fn.endsWith(".svg")) mediaType = MediaType.valueOf("image/svg+xml");
            }
        } catch (Exception ignored) {}

        String dispositionType = asDownload ? "attachment" : "inline";
        String contentDisposition = dispositionType + "; filename=\"" + filename + "\"";

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                .body(resource);
    }
}
