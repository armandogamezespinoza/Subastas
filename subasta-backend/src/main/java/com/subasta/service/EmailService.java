package com.subasta.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    @Value("${brevo.sender.email:no-reply@subasta.mx}")
    private String senderEmail;

    @Value("${brevo.sender.name:SUBASTA}")
    private String senderName;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender, ObjectMapper objectMapper) {
        this.mailSender = mailSender;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Async
    public void sendVerificationCode(String toEmail, String code) {
        log.info(">>> [EMAIL DISPATCH] Dispatching verification code to {}", toEmail);
        String subject = "Código de verificación — SUBASTA";
        String content = "Tu código de verificación es: " + code + "\n\nEste código expira en 10 minutos.";
        dispatchEmail(toEmail, subject, content);
    }

    @Async
    public void sendPasswordResetCode(String toEmail, String code) {
        log.info(">>> [EMAIL DISPATCH] Dispatching password reset code to {}", toEmail);
        String subject = "Recuperación de contraseña — SUBASTA";
        String content = "Has solicitado recuperar tu contraseña en SUBASTA.\n\nTu código de verificación es: " + code + "\n\nEste código expira en 10 minutos.\n\nSi no realizaste esta solicitud, puedes ignorar este mensaje.";
        dispatchEmail(toEmail, subject, content);
    }

    private void dispatchEmail(String toEmail, String subject, String textContent) {
        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            sendViaBrevoApi(toEmail, subject, textContent);
        } else if (mailSender != null) {
            sendViaSmtp(toEmail, subject, textContent);
        } else {
            log.warn("No email dispatch provider configured (neither Brevo API Key nor SMTP mailSender).");
        }
    }

    private void sendViaBrevoApi(String toEmail, String subject, String textContent) {
        try {
            String fromEmail = (senderEmail != null && !senderEmail.isBlank()) ? senderEmail : "no-reply@subasta.mx";
            String fromName = (senderName != null && !senderName.isBlank()) ? senderName : "SUBASTA";

            Map<String, Object> payload = Map.of(
                    "sender", Map.of("name", fromName, "email", fromEmail),
                    "to", List.of(Map.of("email", toEmail)),
                    "subject", subject,
                    "textContent", textContent
            );

            String requestBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_API_URL))
                    .header("accept", "application/json")
                    .header("api-key", brevoApiKey.trim())
                    .header("content-type", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info(">>> [EMAIL DISPATCH via Brevo API] Successfully sent to {} (status: {})", toEmail, response.statusCode());
            } else {
                log.error(">>> [EMAIL DISPATCH via Brevo API] Error sending to {}: status={}, body={}", toEmail, response.statusCode(), response.body());
                if (mailSender != null) {
                    log.info("Attempting SMTP fallback for {}", toEmail);
                    sendViaSmtp(toEmail, subject, textContent);
                }
            }
        } catch (Exception e) {
            log.error(">>> [EMAIL DISPATCH via Brevo API] Exception sending to {}: {}", toEmail, e.getMessage());
            if (mailSender != null) {
                sendViaSmtp(toEmail, subject, textContent);
            }
        }
    }

    private void sendViaSmtp(String toEmail, String subject, String textContent) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(textContent);
            mailSender.send(message);
            log.info(">>> [EMAIL DISPATCH via SMTP] Verification code successfully sent to {}", toEmail);
        } catch (Exception e) {
            log.warn("Could not dispatch email via SMTP to {}: {}", toEmail, e.getMessage());
        }
    }
}
