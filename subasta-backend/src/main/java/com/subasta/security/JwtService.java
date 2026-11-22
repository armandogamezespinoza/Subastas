package com.subasta.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Date;
import java.util.HexFormat;
import java.util.Map;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration-ms:1800000}")
    private long expirationMs;

    @jakarta.annotation.PostConstruct
    public void validateSecret() {
        if (secret == null || secret.isBlank() || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET no esta configurado o es inseguro (minimo 256 bits). Configure la variable de entorno JWT_SECRET.");
        }
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String hashCode(String code) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest((code + secret).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Error hashing code", e);
        }
    }

    // 1. Challenge token generated when the 6-digit code is dispatched (valid for 10 minutes)
    // REMEDIATION VULN-02: Se elimina codeHash del JWT para evitar ataques de fuerza bruta offline
    public String createChallengeToken(String email, String challengeId) {
        return Jwts.builder()
                .subject(email)
                .claims(Map.of(
                        "type", "CHALLENGE_CODE",
                        "challengeId", challengeId
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 10 * 60 * 1000))
                .signWith(getSigningKey())
                .compact();
    }

    // 2. Token issued when code is confirmed (proof that email is verified, valid for 30 minutes)
    public String createVerifiedEmailToken(String email) {
        return Jwts.builder()
                .subject(email)
                .claims(Map.of(
                        "type", "EMAIL_VERIFIED",
                        "email_verified", true
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    // 3. User login access token
    public String createAccessToken(String email, String rol) {
        return Jwts.builder()
                .subject(email)
                .claims(Map.of(
                        "type", "ACCESS_TOKEN",
                        "rol", rol
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
