package com.subasta.controller;

import com.subasta.dto.SendCodeRequest;
import com.subasta.dto.VerifyCodeRequest;
import com.subasta.security.JwtService;
import com.subasta.service.EmailService;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final JwtService jwtService;
    private final EmailService emailService;

    public AuthController(JwtService jwtService, EmailService emailService) {
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    @PostMapping("/send-code")
    public ResponseEntity<?> sendCode(@Valid @RequestBody SendCodeRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String code = String.valueOf(100000 + new SecureRandom().nextInt(900000));
        String challengeToken = jwtService.createChallengeToken(email, code);

        emailService.sendVerificationCode(email, code);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Código enviado exitosamente a tu correo",
                "challengeToken", challengeToken
        ));
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        try {
            Claims claims = jwtService.parseToken(request.getChallengeToken());
            String email = claims.getSubject();
            String expectedHash = claims.get("codeHash", String.class);

            if (!jwtService.hashCode(request.getCode().trim()).equals(expectedHash)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Código de verificación incorrecto"
                ));
            }

            String verifiedEmailToken = jwtService.createVerifiedEmailToken(email);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "verified", true,
                    "email", email,
                    "verifiedEmailToken", verifiedEmailToken
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "El código ha expirado o el token es inválido"
            ));
        }
    }
}
