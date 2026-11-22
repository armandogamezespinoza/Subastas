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
        log.info(">>> [EMAIL DISPATCH] Dispatching verification code to {}", toEmail);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Código de verificación — SUBASTA");
            message.setText("Tu código de verificación es: " + code + "\n\nEste código expira en 10 minutos.");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Could not dispatch email via SMTP: {}", e.getMessage());
        }
    }
}
