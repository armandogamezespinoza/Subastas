package com.subasta.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VerificationCodeService {

    public static final int MAX_ATTEMPTS = 3;
    public static final long EXPIRATION_SECONDS = 600; // 10 minutos
    public static final long COOLDOWN_SECONDS = 60;   // 60 segundos de espera entre envíos
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public static class CodeEntry {
        private final String email;
        private final String code;
        private final Instant expiresAt;
        private int failedAttempts;

        public CodeEntry(String email, String code, Instant expiresAt) {
            this.email = email;
            this.code = code;
            this.expiresAt = expiresAt;
            this.failedAttempts = 0;
        }

        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }

        public String getEmail() {
            return email;
        }

        public String getCode() {
            return code;
        }

        public int getFailedAttempts() {
            return failedAttempts;
        }

        public void incrementFailedAttempts() {
            this.failedAttempts++;
        }
    }

    private final Map<String, CodeEntry> challengeStore = new ConcurrentHashMap<>();
    private final Map<String, Instant> cooldownStore = new ConcurrentHashMap<>();

    public boolean isCooldownActive(String email) {
        if (email == null) return false;
        Instant allowedAfter = cooldownStore.get(email.toLowerCase().trim());
        return allowedAfter != null && Instant.now().isBefore(allowedAfter);
    }

    public long getCooldownSecondsRemaining(String email) {
        if (email == null) return 0;
        Instant allowedAfter = cooldownStore.get(email.toLowerCase().trim());
        if (allowedAfter == null) return 0;
        long diff = allowedAfter.getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(0, diff);
    }

    public String generateAndStoreCode(String email) {
        cleanExpiredEntries();
        String normalizedEmail = email.toLowerCase().trim();

        // Registrar cooldown de 60 segundos para evitar saturación de correo y abuso de endpoint
        cooldownStore.put(normalizedEmail, Instant.now().plusSeconds(COOLDOWN_SECONDS));

        // Generación criptográficamente segura de 6 dígitos
        String code = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        String challengeId = UUID.randomUUID().toString();
        challengeStore.put(challengeId, new CodeEntry(
                normalizedEmail,
                code,
                Instant.now().plusSeconds(EXPIRATION_SECONDS)
        ));
        return challengeId;
    }

    public String getCodeForChallenge(String challengeId) {
        CodeEntry entry = challengeStore.get(challengeId);
        return entry != null ? entry.getCode() : null;
    }

    public enum VerificationResult {
        SUCCESS,
        INVALID_OR_EXPIRED,
        MAX_ATTEMPTS_EXCEEDED,
        CODE_MISMATCH
    }

    public VerificationResult verifyCode(String challengeId, String submittedCode, String expectedEmail) {
        cleanExpiredEntries();
        if (challengeId == null || submittedCode == null) {
            return VerificationResult.INVALID_OR_EXPIRED;
        }

        CodeEntry entry = challengeStore.get(challengeId);
        if (entry == null || entry.isExpired()) {
            challengeStore.remove(challengeId);
            return VerificationResult.INVALID_OR_EXPIRED;
        }

        if (expectedEmail != null && !entry.getEmail().equalsIgnoreCase(expectedEmail.trim())) {
            return VerificationResult.INVALID_OR_EXPIRED;
        }

        if (entry.getFailedAttempts() >= MAX_ATTEMPTS) {
            challengeStore.remove(challengeId);
            return VerificationResult.MAX_ATTEMPTS_EXCEEDED;
        }

        if (!entry.getCode().equals(submittedCode.trim())) {
            entry.incrementFailedAttempts();
            if (entry.getFailedAttempts() >= MAX_ATTEMPTS) {
                challengeStore.remove(challengeId);
                return VerificationResult.MAX_ATTEMPTS_EXCEEDED;
            }
            return VerificationResult.CODE_MISMATCH;
        }

        // Éxito: Se invalida inmediatamente el código para prevenir ataques de reutilización (Replay)
        challengeStore.remove(challengeId);
        return VerificationResult.SUCCESS;
    }

    public int getRemainingAttempts(String challengeId) {
        CodeEntry entry = challengeStore.get(challengeId);
        if (entry == null) return 0;
        return Math.max(0, MAX_ATTEMPTS - entry.getFailedAttempts());
    }

    public void clearCooldown(String email) {
        if (email != null) {
            cooldownStore.remove(email.toLowerCase().trim());
        }
    }

    private void cleanExpiredEntries() {
        challengeStore.entrySet().removeIf(e -> e.getValue().isExpired());
        cooldownStore.entrySet().removeIf(e -> Instant.now().isAfter(e.getValue()));
    }
}
