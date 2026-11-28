package com.subasta.service;

import com.subasta.entity.Comprador;
import com.subasta.entity.Vendedor;
import com.subasta.repository.CompradorRepository;
import com.subasta.repository.UsuarioRepository;
import com.subasta.repository.VendedorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Rechaza automáticamente solicitudes pendientes que no han recibido
 * actualizaciones en un plazo de dos semanas.
 */
@Service
public class RequestExpirationService {

    private static final Logger log = LoggerFactory.getLogger(RequestExpirationService.class);
    private static final Set<String> TERMINAL_STATUSES = Set.of("APROBADO", "RECHAZADO", "NEGADO");

    private final CompradorRepository compradorRepository;
    private final VendedorRepository vendedorRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailTemplateService emailTemplateService;

    public RequestExpirationService(CompradorRepository compradorRepository,
                                    VendedorRepository vendedorRepository,
                                    UsuarioRepository usuarioRepository,
                                    EmailTemplateService emailTemplateService) {
        this.compradorRepository = compradorRepository;
        this.vendedorRepository = vendedorRepository;
        this.usuarioRepository = usuarioRepository;
        this.emailTemplateService = emailTemplateService;
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public int rejectExpiredRequests() {
        LocalDateTime cutoff = LocalDateTime.now().minusWeeks(2);
        int rejectedCount = 0;

        List<Comprador> compradores = compradorRepository.findAll();
        for (Comprador c : compradores) {
            if (isExpired(c.getEstatus(), c.getFechaActualizacion(), c.getFechaCreacion(), cutoff)) {
                c.setEstatus("RECHAZADO");
                c.setFechaActualizacion(LocalDateTime.now());
                compradorRepository.save(c);
                deactivateUser(c.getUsuarioId());
                String nombre = resolveNombre(c.getNombres(), c.getRazonSocial());
                sendAutoRejectionEmail(c.getEmail(), nombre, c.getFolio());
                rejectedCount++;
            }
        }

        List<Vendedor> vendedores = vendedorRepository.findAll();
        for (Vendedor v : vendedores) {
            if (isExpired(v.getEstatus(), v.getFechaActualizacion(), v.getFechaCreacion(), cutoff)) {
                v.setEstatus("RECHAZADO");
                v.setFechaActualizacion(LocalDateTime.now());
                vendedorRepository.save(v);
                deactivateUser(v.getUsuarioId());
                String nombre = resolveNombre(v.getNombres(), v.getRazonSocial());
                sendAutoRejectionEmail(v.getEmail(), nombre, v.getFolio());
                rejectedCount++;
            }
        }

        if (rejectedCount > 0) {
            log.info("Auto-rechazo por inactividad de 2 semanas: {} solicitud(es) rechazada(s).", rejectedCount);
        }
        return rejectedCount;
    }

    private boolean isExpired(String estatus, LocalDateTime updatedAt, LocalDateTime createdAt, LocalDateTime cutoff) {
        String normalized = estatus != null ? estatus.trim().toUpperCase() : "ENVIADO";
        if (TERMINAL_STATUSES.contains(normalized)) {
            return false;
        }
        LocalDateTime reference = updatedAt != null ? updatedAt : createdAt;
        return reference != null && reference.isBefore(cutoff);
    }

    private void deactivateUser(Long usuarioId) {
        if (usuarioId == null) {
            return;
        }
        usuarioRepository.findById(usuarioId).ifPresent(u -> {
            u.setEstatus("RECHAZADO");
            u.setActivo(false);
            usuarioRepository.save(u);
        });
    }

    private void sendAutoRejectionEmail(String email, String nombre, String folio) {
        if (email == null || email.isBlank()) {
            return;
        }
        Map<String, String> params = Map.of(
                "nombreCliente", nombre,
                "folio", folio != null ? folio : ""
        );
        emailTemplateService.sendTemplatedEmail(
                email,
                EmailTemplateService.TEMPLATE_RECHAZO_DIRECTO,
                params,
                null,
                null
        );
    }

    private String resolveNombre(String nombres, String razonSocial) {
        if (nombres != null && !nombres.isBlank()) {
            return nombres.trim();
        }
        if (razonSocial != null && !razonSocial.isBlank()) {
            return razonSocial.trim();
        }
        return "Usuario";
    }
}

