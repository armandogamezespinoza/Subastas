package com.subasta.controller;

import com.subasta.dto.RevisionItemDto;
import com.subasta.dto.UpdateEstatusRequest;
import com.subasta.entity.Comprador;
import com.subasta.entity.Documento;
import com.subasta.entity.Usuario;
import com.subasta.entity.Vendedor;
import com.subasta.repository.CompradorRepository;
import com.subasta.repository.DocumentoRepository;
import com.subasta.repository.UsuarioRepository;
import com.subasta.repository.VendedorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/revision")
@CrossOrigin(origins = "*")
public class RevisionController {

    private final CompradorRepository compradorRepository;
    private final VendedorRepository vendedorRepository;
    private final DocumentoRepository documentoRepository;
    private final UsuarioRepository usuarioRepository;

    public RevisionController(CompradorRepository compradorRepository,
                              VendedorRepository vendedorRepository,
                              DocumentoRepository documentoRepository,
                              UsuarioRepository usuarioRepository) {
        this.compradorRepository = compradorRepository;
        this.vendedorRepository = vendedorRepository;
        this.documentoRepository = documentoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // ─── GET /api/v1/revision/solicitudes ────────────────────────────────────
    @GetMapping("/solicitudes")
    public ResponseEntity<List<RevisionItemDto>> listarSolicitudes(
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String estatus) {

        List<RevisionItemDto> resultado = new ArrayList<>();

        // Compradores
        if (tipo == null || tipo.equalsIgnoreCase("COMPRADOR")) {
            List<Comprador> compradores = compradorRepository.findAll();
            for (Comprador c : compradores) {
                // Los compradores no tienen campo estatus en la entidad.
                // Usamos el campo activo del usuario vinculado como referencia.
                String estatusComprador = resolveEstatusComprador(c);
                if (estatus != null && !estatus.equalsIgnoreCase(estatusComprador)) continue;
                int docs = documentoRepository.findByTipoUsuarioAndRegistroId("COMPRADOR", c.getId()).size();
                String nombre = buildNombreComprador(c);
                resultado.add(new RevisionItemDto(
                        c.getId(), c.getFolio(), "COMPRADOR", c.getTipoPersona(),
                        nombre, c.getRfc(), c.getEmail(), c.getTelefono(),
                        estatusComprador, c.getFechaCreacion(), docs));
            }
        }

        // Vendedores
        if (tipo == null || tipo.equalsIgnoreCase("VENDEDOR")) {
            List<Vendedor> vendedores = vendedorRepository.findAll();
            for (Vendedor v : vendedores) {
                String estatusVendedor = v.getEstatus() != null ? v.getEstatus() : "ENVIADO";
                if (estatus != null && !estatus.equalsIgnoreCase(estatusVendedor)) continue;
                int docs = documentoRepository.findByTipoUsuarioAndRegistroId("VENDEDOR", v.getId()).size();
                String nombre = buildNombreVendedor(v);
                resultado.add(new RevisionItemDto(
                        v.getId(), v.getFolio(), "VENDEDOR", v.getTipoPersona(),
                        nombre, v.getRfc(), v.getEmail(), v.getTelefono(),
                        estatusVendedor, v.getFechaCreacion(), docs));
            }
        }

        // Ordenar por fecha de creación descendente
        resultado.sort((a, b) -> {
            if (a.getFechaCreacion() == null && b.getFechaCreacion() == null) return 0;
            if (a.getFechaCreacion() == null) return 1;
            if (b.getFechaCreacion() == null) return -1;
            return b.getFechaCreacion().compareTo(a.getFechaCreacion());
        });

        return ResponseEntity.ok(resultado);
    }

    // ─── GET /api/v1/revision/solicitudes/{tipo}/{id} ──────────────────────
    @GetMapping("/solicitudes/{tipo}/{id}")
    public ResponseEntity<Map<String, Object>> detalleSolicitud(
            @PathVariable String tipo,
            @PathVariable Long id) {

        Map<String, Object> detalle = new LinkedHashMap<>();

        if (tipo.equalsIgnoreCase("COMPRADOR")) {
            Optional<Comprador> opt = compradorRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.notFound().build();
            Comprador c = opt.get();
            detalle.put("id", c.getId());
            detalle.put("folio", c.getFolio());
            detalle.put("tipo", "COMPRADOR");
            detalle.put("tipoPersona", c.getTipoPersona());
            detalle.put("nombres", c.getNombres());
            detalle.put("apellidoPaterno", c.getApellidoPaterno());
            detalle.put("apellidoMaterno", c.getApellidoMaterno());
            detalle.put("email", c.getEmail());
            detalle.put("telefono", c.getTelefono());
            detalle.put("curp", c.getCurp());
            detalle.put("rfc", c.getRfc());
            detalle.put("razonSocial", c.getRazonSocial());
            detalle.put("calle", c.getCalle());
            detalle.put("codigoPostal", c.getCodigoPostal());
            detalle.put("colonia", c.getColonia());
            detalle.put("ciudad", c.getCiudad());
            detalle.put("estado", c.getEstado());
            detalle.put("fechaNacimiento", c.getFechaNacimiento());
            detalle.put("fechaCreacion", c.getFechaCreacion());
            detalle.put("estatus", resolveEstatusComprador(c));
            List<Documento> docs = documentoRepository.findByTipoUsuarioAndRegistroId("COMPRADOR", id);
            detalle.put("documentos", mapDocumentos(docs));
        } else if (tipo.equalsIgnoreCase("VENDEDOR")) {
            Optional<Vendedor> opt = vendedorRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.notFound().build();
            Vendedor v = opt.get();
            detalle.put("id", v.getId());
            detalle.put("folio", v.getFolio());
            detalle.put("tipo", "VENDEDOR");
            detalle.put("tipoPersona", v.getTipoPersona());
            detalle.put("nombres", v.getNombres());
            detalle.put("apellidoPaterno", v.getApellidoPaterno());
            detalle.put("apellidoMaterno", v.getApellidoMaterno());
            detalle.put("email", v.getEmail());
            detalle.put("telefono", v.getTelefono());
            detalle.put("curp", v.getCurp());
            detalle.put("rfc", v.getRfc());
            detalle.put("razonSocial", v.getRazonSocial());
            detalle.put("regimenFiscal", v.getRegimenFiscal());
            detalle.put("actividadEconomica", v.getActividadEconomica());
            detalle.put("repNombre", v.getRepNombre());
            detalle.put("repRfc", v.getRepRfc());
            detalle.put("calle", v.getCalle());
            detalle.put("codigoPostal", v.getCodigoPostal());
            detalle.put("colonia", v.getColonia());
            detalle.put("ciudad", v.getCiudad());
            detalle.put("estado", v.getEstado());
            detalle.put("fechaCreacion", v.getFechaCreacion());
            detalle.put("estatus", v.getEstatus() != null ? v.getEstatus() : "ENVIADO");
            List<Documento> docs = documentoRepository.findByTipoUsuarioAndRegistroId("VENDEDOR", id);
            detalle.put("documentos", mapDocumentos(docs));
        } else {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(detalle);
    }

    // ─── PUT /api/v1/revision/solicitudes/{tipo}/{id}/estatus ──────────────
    @PutMapping("/solicitudes/{tipo}/{id}/estatus")
    public ResponseEntity<Map<String, Object>> actualizarEstatus(
            @PathVariable String tipo,
            @PathVariable Long id,
            @RequestBody UpdateEstatusRequest req) {

        String nuevoEstatus = req.getEstatus();
        if (nuevoEstatus == null || nuevoEstatus.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Estatus requerido"));
        }

        Map<String, Object> respuesta = new LinkedHashMap<>();

        if (tipo.equalsIgnoreCase("VENDEDOR")) {
            Optional<Vendedor> opt = vendedorRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.notFound().build();
            Vendedor v = opt.get();
            v.setEstatus(nuevoEstatus.toUpperCase());
            vendedorRepository.save(v);

            // Activar/desactivar usuario vinculado
            if (v.getUsuarioId() != null) {
                Optional<Usuario> uOpt = usuarioRepository.findById(v.getUsuarioId());
                uOpt.ifPresent(u -> {
                    u.setActivo("APROBADO".equals(nuevoEstatus.toUpperCase()));
                    usuarioRepository.save(u);
                });
            }
            respuesta.put("id", v.getId());
            respuesta.put("tipo", "VENDEDOR");
            respuesta.put("estatus", v.getEstatus());
            respuesta.put("ok", true);

        } else if (tipo.equalsIgnoreCase("COMPRADOR")) {
            Optional<Comprador> opt = compradorRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.notFound().build();
            Comprador c = opt.get();

            // Para compradores, actualizamos activo del usuario
            if (c.getUsuarioId() != null) {
                Optional<Usuario> uOpt = usuarioRepository.findById(c.getUsuarioId());
                uOpt.ifPresent(u -> {
                    u.setActivo("APROBADO".equals(nuevoEstatus.toUpperCase()));
                    usuarioRepository.save(u);
                });
            }
            respuesta.put("id", c.getId());
            respuesta.put("tipo", "COMPRADOR");
            respuesta.put("estatus", nuevoEstatus.toUpperCase());
            respuesta.put("ok", true);
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Tipo inválido"));
        }

        return ResponseEntity.ok(respuesta);
    }

    // ─── GET /api/v1/revision/kpis ───────────────────────────────────────
    @GetMapping("/kpis")
    public ResponseEntity<Map<String, Object>> kpis() {
        long totalCompradores = compradorRepository.count();
        long totalVendedores = vendedorRepository.count();

        List<Vendedor> vendedores = vendedorRepository.findAll();
        long aprobados = vendedores.stream().filter(v -> "APROBADO".equals(v.getEstatus())).count();
        long rechazados = vendedores.stream().filter(v -> "RECHAZADO".equals(v.getEstatus())).count();
        long enRevision = vendedores.stream().filter(v -> "EN_REVISION".equals(v.getEstatus())).count();
        long enviados = vendedores.stream().filter(v -> v.getEstatus() == null || "ENVIADO".equals(v.getEstatus())).count();

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("totalCompradores", totalCompradores);
        res.put("totalVendedores", totalVendedores);
        res.put("total", totalCompradores + totalVendedores);
        res.put("aprobados", aprobados);
        res.put("rechazados", rechazados);
        res.put("enRevision", enRevision);
        res.put("enviados", enviados + totalCompradores); // compradores sin estatus = enviados
        return ResponseEntity.ok(res);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────
    private String resolveEstatusComprador(Comprador c) {
        if (c.getUsuarioId() == null) return "ENVIADO";
        Optional<Usuario> uOpt = usuarioRepository.findById(c.getUsuarioId());
        if (uOpt.isEmpty()) return "ENVIADO";
        Boolean activo = uOpt.get().getActivo();
        if (activo == null) return "ENVIADO";
        return activo ? "APROBADO" : "ENVIADO";
    }

    private String buildNombreComprador(Comprador c) {
        if ("MORAL".equalsIgnoreCase(c.getTipoPersona()) && c.getRazonSocial() != null) {
            return c.getRazonSocial();
        }
        StringBuilder sb = new StringBuilder();
        if (c.getNombres() != null) sb.append(c.getNombres());
        if (c.getApellidoPaterno() != null) sb.append(" ").append(c.getApellidoPaterno());
        if (c.getApellidoMaterno() != null) sb.append(" ").append(c.getApellidoMaterno());
        return sb.toString().trim();
    }

    private String buildNombreVendedor(Vendedor v) {
        if ("MORAL".equalsIgnoreCase(v.getTipoPersona()) && v.getRazonSocial() != null) {
            return v.getRazonSocial();
        }
        StringBuilder sb = new StringBuilder();
        if (v.getNombres() != null) sb.append(v.getNombres());
        if (v.getApellidoPaterno() != null) sb.append(" ").append(v.getApellidoPaterno());
        if (v.getApellidoMaterno() != null) sb.append(" ").append(v.getApellidoMaterno());
        return sb.toString().trim();
    }

    private List<Map<String, Object>> mapDocumentos(List<Documento> docs) {
        return docs.stream().map(d -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", d.getId());
            m.put("tipoDocumento", d.getTipoDocumento());
            m.put("nombreArchivo", d.getNombreArchivo());
            m.put("rutaArchivo", d.getRutaArchivo());
            m.put("fechaSubida", d.getFechaSubida());
            return m;
        }).collect(Collectors.toList());
    }
}
