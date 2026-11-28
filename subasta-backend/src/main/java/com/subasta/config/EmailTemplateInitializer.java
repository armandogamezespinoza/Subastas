package com.subasta.config;

import com.subasta.entity.EmailTemplate;
import com.subasta.repository.EmailTemplateRepository;
import com.subasta.service.EmailTemplateService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Inicializa en la base de datos las plantillas de correo base si no existen.
 */
@Component
public class EmailTemplateInitializer implements CommandLineRunner {

    private final EmailTemplateRepository emailTemplateRepository;

    public EmailTemplateInitializer(EmailTemplateRepository emailTemplateRepository) {
        this.emailTemplateRepository = emailTemplateRepository;
    }

    @Override
    public void run(String... args) {
        List<EmailTemplate> defaults = List.of(
                new EmailTemplate(
                        EmailTemplateService.TEMPLATE_APROBACION,
                        "Aprobación de solicitud",
                        "Solicitud aprobada — Folio {folio} — SUBASTA",
                        "Hemos revisado tu documentación y es correcta.\n\n"
                                + "Para terminar con el proceso de dar de alta tu usuario, es necesario realizar el depósito de $5000 mxn.\n\n"
                                + "Puedes realizarlo por transferencia a la cuenta {numeroCuenta}\n\n"
                                + "Colocando en el asunto de la transferencia tu folio {folio}\n\n"
                                + "Puedes enviar la evidencia de la transferencia en este mismo hilo de correos.\n\n"
                                + "Nosotros nos pondremos en contacto contigo"
                ),
                new EmailTemplate(
                        EmailTemplateService.TEMPLATE_OBSERVACION_DOCUMENTO,
                        "Inconveniente con documentación",
                        "Observación en tu documentación — Folio {folio} — SUBASTA",
                        "Hola {nombreCliente}.\n\n"
                                + "Encontramos un inconveniente con tu documentación, revisando el archivo anexado en el campo {campoDocumento} encontramos que {detalleInconveniente}\n\n"
                                + "Quedamos atentos a tu respuesta por este medio para poder brindarle el seguimiento.\n\n"
                                + "En caso de no recibir actualizaciones, procederemos con el rechazo de la solicitud."
                ),
                new EmailTemplate(
                        EmailTemplateService.TEMPLATE_RECHAZO_DIRECTO,
                        "Rechazo de solicitud",
                        "Resultado de tu solicitud — Folio {folio} — SUBASTA",
                        "Hola {nombreCliente}.\n\n"
                                + "Gracias por iniciar con el proceso para dar de alta tu usuario.\n\n"
                                + "Un moderador ha rechazado tu solicitud.\n"
                                + "Si presentas dudas o comentarios, puedes enviarlos por este medio, respondiendo al hilo de correos, o comunicandote al {telefonoContacto}"
                )
        );

        for (EmailTemplate template : defaults) {
            if (emailTemplateRepository.findByCodigo(template.getCodigo()).isEmpty()) {
                emailTemplateRepository.save(template);
            }
        }
    }
}

