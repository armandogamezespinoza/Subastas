package com.subasta.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationCode(String toEmail, String code) {
        log.info("==================================================");
        log.info(">>> [EMAIL DISPATCH] Verification code for {}: {}", toEmail, code);
        log.info("==================================================");

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Código de verificación — SUBASTA");
            message.setText("Tu código de verificación es: " + code + "\n\nEste código expira en 10 minutos.");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Could not dispatch email via SMTP (make sure SMTP credentials are set in application.yml): {}", e.getMessage());
            log.info("You can use the logged code above for testing in your browser!");
        }
    }
}
