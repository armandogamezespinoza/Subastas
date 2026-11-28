package com.subasta.service;

import com.subasta.entity.EmailTemplate;
import com.subasta.repository.EmailTemplateRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio para consultar plantillas de correo desde la base de datos,
 * interpolar parámetros dinámicos y despachar correos personalizados.
 */
@Service
public class EmailTemplateService {

    public static final String TEMPLATE_APROBACION = "APROBACION";
    public static final String TEMPLATE_OBSERVACION_DOCUMENTO = "OBSERVACION_DOCUMENTO";
    public static final String TEMPLATE_RECHAZO_DIRECTO = "RECHAZO_DIRECTO";

    private final EmailTemplateRepository emailTemplateRepository;
    private final EmailService emailService;

    @Value("${app.bank.account-number:}")
    private String bankAccountNumber;

    @Value("${app.support.phone:}")
    private String supportPhone;

    public EmailTemplateService(EmailTemplateRepository emailTemplateRepository,
                                EmailService emailService) {
        this.emailTemplateRepository = emailTemplateRepository;
        this.emailService = emailService;
    }

    public List<EmailTemplate> getAllTemplates() {
        return emailTemplateRepository.findAll();
    }

    public EmailTemplate getRequiredTemplate(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new IllegalArgumentException("El código de plantilla es obligatorio.");
        }
        return emailTemplateRepository.findByCodigo(codigo.trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("No existe la plantilla de correo: " + codigo));
    }

    public Map<String, String> getEnvironmentDefaults() {
        Map<String, String> defaults = new HashMap<>();
        defaults.put("numeroCuenta", bankAccountNumber != null ? bankAccountNumber : "");
        defaults.put("telefonoContacto", supportPhone != null ? supportPhone : "");
        return defaults;
    }

    /**
     * Renderiza el asunto y cuerpo de una plantilla sustituyendo marcadores {clave}.
     */
    public Map<String, String> renderTemplate(String codigo, Map<String, String> params) {
        EmailTemplate template = getRequiredTemplate(codigo);

        Map<String, String> merged = new HashMap<>(getEnvironmentDefaults());
        if (params != null) {
            params.forEach((k, v) -> {
                if (k != null && v != null) {
                    merged.put(k, v);
                }
            });
        }

        String renderedSubject = applyPlaceholders(template.getAsunto(), merged);
        String renderedBody = applyPlaceholders(template.getCuerpo(), merged);

        Map<String, String> result = new HashMap<>();
        result.put("codigo", template.getCodigo());
        result.put("nombre", template.getNombre());
        result.put("asunto", renderedSubject);
        result.put("mensaje", renderedBody);
        return result;
    }

    /**
     * Envía un correo usando una plantilla de BD con parámetros dinámicos,
     * permitiendo que el moderador sobrescriba asunto o mensaje si los editó.
     */
    public void sendTemplatedEmail(String toEmail,
                                   String templateCode,
                                   Map<String, String> params,
                                   String customSubject,
                                   String customBody) {
        if (toEmail == null || toEmail.isBlank()) {
            return;
        }

        Map<String, String> rendered = renderTemplate(templateCode, params);
        String subject = (customSubject != null && !customSubject.isBlank())
                ? customSubject
                : rendered.get("asunto");
        String body = (customBody != null && !customBody.isBlank())
                ? customBody
                : rendered.get("mensaje");

        emailService.sendCustomEmail(toEmail, subject, body);
    }

    private String applyPlaceholders(String text, Map<String, String> params) {
        if (text == null) {
            return "";
        }
        String result = text;
        for (Map.Entry<String, String> entry : params.entrySet()) {
            result = result.replace("{" + entry.getKey() + "}", entry.getValue());
        }
        return result;
    }
}

