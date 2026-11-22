package com.subasta.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Servicio de protección contra fuerza bruta a nivel de cuenta.
 * <p>
 * Complementa el rate limiting por IP de Nginx con bloqueo temporal por identificador
 * de cuenta (email o teléfono). Después de {@value #MAX_ATTEMPTS} intentos fallidos,
 * el identificador se bloquea por {@value #LOCKOUT_SECONDS} segundos.
 * <p>
 * <b>Diseño anti-enumeración:</b> El bloqueo se aplica al identificador enviado por el
 * cliente (no al usuario en base de datos), de modo que la respuesta es idéntica
 * independientemente de si la cuenta existe o no.
 * <p>
 * <b>Limitaciones (documentadas):</b>
 * <ul>
 *   <li>Almacenamiento en memoria (ConcurrentHashMap): los contadores se pierden al
 *       reiniciar la JVM. En la arquitectura actual (un solo backend) esto es aceptable.</li>
 *   <li>Con múltiples instancias de backend, cada instancia mantendrá contadores independientes,
 *       multiplicando los intentos efectivos del atacante por N instancias. Para ese escenario
 *       se recomienda migrar a Redis o una tabla en base de datos.</li>
 *   <li>Un atacante puede provocar bloqueos temporales sobre cuentas de terceros (account-lockout DoS).
 *       Se mitiga usando un tiempo de bloqueo corto (15 min) y requiriendo 5 intentos previos
 *       por IP (el rate limit Nginx a 10r/m por IP dificulta que un atacante agote 5 intentos rápidamente).</li>
 * </ul>
 */
@Service
public class LoginAttemptService {

    private static final Logger log = LoggerFactory.getLogger(LoginAttemptService.class);

    /** Intentos fallidos antes de bloquear el identificador. */
    public static final int MAX_ATTEMPTS = 5;

    /** Duración del bloqueo en segundos (15 minutos). */
    public static final long LOCKOUT_SECONDS = 15 * 60;

    /**
     * Registro de intentos fallidos por identificador normalizado.
     * Se utiliza ConcurrentHashMap para thread-safety sin bloqueo global.
     */
    private final Map<String, AttemptRecord> attempts = new ConcurrentHashMap<>();

    /**
     * Registro inmutable con conteo atómico para prevenir condiciones de carrera.
     */
    static class AttemptRecord {
        private final AtomicInteger failedCount = new AtomicInteger(0);
        private volatile Instant lockedUntil;

        int getFailedCount() {
            return failedCount.get();
        }

        int incrementAndGet() {
            return failedCount.incrementAndGet();
        }

        void reset() {
            failedCount.set(0);
            lockedUntil = null;
        }

        Instant getLockedUntil() {
            return lockedUntil;
        }

        void lock(Instant until) {
            this.lockedUntil = until;
        }
    }

    /**
     * Normaliza el identificador de login (email o teléfono) para agrupar intentos.
     * No registra el valor completo en logs para proteger datos personales.
     */
    private String normalize(String identifier) {
        if (identifier == null) return "";
        return identifier.trim().toLowerCase();
    }

    /**
     * Verifica si el identificador está actualmente bloqueado.
     *
     * @return true si el identificador está bloqueado por exceso de intentos
     */
    public boolean isBlocked(String identifier) {
        String key = normalize(identifier);
        AttemptRecord record = attempts.get(key);
        if (record == null) return false;

        Instant lockedUntil = record.getLockedUntil();
        if (lockedUntil != null && Instant.now().isBefore(lockedUntil)) {
            return true;
        }

        // Si el bloqueo expiró, limpiar el registro
        if (lockedUntil != null && !Instant.now().isBefore(lockedUntil)) {
            record.reset();
        }

        return false;
    }

    /**
     * Retorna los segundos restantes de bloqueo para incluir en Retry-After.
     */
    public long getLockoutSecondsRemaining(String identifier) {
        String key = normalize(identifier);
        AttemptRecord record = attempts.get(key);
        if (record == null) return 0;

        Instant lockedUntil = record.getLockedUntil();
        if (lockedUntil == null) return 0;

        long remaining = lockedUntil.getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(0, remaining);
    }

    /**
     * Registra un intento de login fallido. Si se alcanza el límite, bloquea el identificador.
     * <p>
     * <b>No se registra el identificador completo en los logs</b> para no exponer
     * datos personales (email/teléfono) en archivos de log.
     */
    public void registerFailedAttempt(String identifier) {
        String key = normalize(identifier);
        AttemptRecord record = attempts.computeIfAbsent(key, k -> new AttemptRecord());

        int current = record.incrementAndGet();
        if (current >= MAX_ATTEMPTS) {
            record.lock(Instant.now().plusSeconds(LOCKOUT_SECONDS));
            log.warn("Cuenta bloqueada temporalmente por exceso de intentos fallidos (identifier-hash={})",
                    Integer.toHexString(key.hashCode()));
        }

        // Limpieza periódica de registros antiguos (cada ~100 registros)
        if (attempts.size() > 1000) {
            cleanExpired();
        }
    }

    /**
     * Reinicia el contador de intentos fallidos tras un login exitoso.
     */
    public void clearAttempts(String identifier) {
        String key = normalize(identifier);
        attempts.remove(key);
    }

    /**
     * Elimina registros de bloqueos expirados para evitar crecimiento ilimitado de la memoria.
     */
    private void cleanExpired() {
        Instant now = Instant.now();
        attempts.entrySet().removeIf(entry -> {
            AttemptRecord r = entry.getValue();
            // Eliminar si el bloqueo expiró y no tiene intentos recientes
            Instant locked = r.getLockedUntil();
            return locked != null && now.isAfter(locked);
        });
    }

    /**
     * Visibilidad para testing: verificar estado interno.
     */
    public int getFailedAttempts(String identifier) {
        String key = normalize(identifier);
        AttemptRecord record = attempts.get(key);
        return record != null ? record.getFailedCount() : 0;
    }
}

