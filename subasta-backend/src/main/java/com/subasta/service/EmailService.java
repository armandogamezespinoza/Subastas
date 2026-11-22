package com.subasta.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendVerificationCode(String toEmail, String code) {
        log.info(">>> [EMAIL DISPATCH] Dispatching verification code to {}", toEmail);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Código de verificación — SUBASTA");
            message.setText("Tu código de verificación es: " + code + "\n\nEste código expira en 10 minutos.");
            mailSender.send(message);
            log.info(">>> [EMAIL DISPATCH] Verification code successfully sent to {}", toEmail);
        } catch (Exception e) {
            log.warn("Could not dispatch email via SMTP to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetCode(String toEmail, String code) {
        log.info(">>> [EMAIL DISPATCH] Dispatching password reset code to {}", toEmail);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Recuperación de contraseña — SUBASTA");
            message.setText("Has solicitado recuperar tu contraseña en SUBASTA.\n\nTu código de verificación es: " + code + "\n\nEste código expira en 10 minutos.\n\nSi no realizaste esta solicitud, puedes ignorar este mensaje.");
            mailSender.send(message);
            log.info(">>> [EMAIL DISPATCH] Password reset code successfully sent to {}", toEmail);
        } catch (Exception e) {
            log.warn("Could not dispatch password reset email via SMTP to {}: {}", toEmail, e.getMessage());
        }
    }
}
