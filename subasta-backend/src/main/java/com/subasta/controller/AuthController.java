package com.subasta.controller;

import com.subasta.dto.ResetPasswordRequest;
import com.subasta.dto.SendCodeRequest;
import com.subasta.dto.VerifyCodeRequest;
import com.subasta.entity.Usuario;
import com.subasta.repository.CompradorRepository;
import com.subasta.repository.UsuarioRepository;
import com.subasta.repository.VendedorRepository;
import com.subasta.security.JwtService;
import com.subasta.service.EmailService;
import com.subasta.service.LoginAttemptService;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final JwtService jwtService;
    private final EmailService emailService;
    private final com.subasta.service.VerificationCodeService verificationCodeService;
    private final LoginAttemptService loginAttemptService;
    private final UsuarioRepository usuarioRepository;
    private final CompradorRepository compradorRepository;
    private final VendedorRepository vendedorRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public AuthController(JwtService jwtService,
                          EmailService emailService,
                          com.subasta.service.VerificationCodeService verificationCodeService,
                          LoginAttemptService loginAttemptService,
                          UsuarioRepository usuarioRepository,
                          CompradorRepository compradorRepository,
                          VendedorRepository vendedorRepository,
                          org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.verificationCodeService = verificationCodeService;
        this.loginAttemptService = loginAttemptService;
        this.usuarioRepository = usuarioRepository;
        this.compradorRepository = compradorRepository;
        this.vendedorRepository = vendedorRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String rawIdentifier = body.get("identifier");
        if (rawIdentifier == null || rawIdentifier.isBlank()) {
            rawIdentifier = body.get("correoTelefono");
        }
        if (rawIdentifier == null || rawIdentifier.isBlank()) {
            rawIdentifier = body.get("email");
        }
        if (rawIdentifier == null || rawIdentifier.isBlank()) {
            rawIdentifier = body.get("telefono");
        }
        String password = body.get("password");
        if (rawIdentifier == null || rawIdentifier.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Debes ingresar tu correo/teléfono y tu contraseña"
            ));
        }

        String identifier = rawIdentifier.trim();

        // Verificar bloqueo por fuerza bruta antes de consultar la base de datos.
        // Se aplica al identificador enviado (no al usuario), para no revelar si la cuenta existe.
        if (loginAttemptService.isBlocked(identifier)) {
            long retryAfter = loginAttemptService.getLockoutSecondsRemaining(identifier);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfter))
                    .body(Map.of(
                            "success", false,
                            "error", "Demasiados intentos fallidos. Intenta de nuevo más tarde."
                    ));
        }

        Optional<Usuario> usuarioOpt = Optional.empty();

        if (identifier.contains("@")) {
            usuarioOpt = usuarioRepository.findByEmail(identifier.toLowerCase());
        } else {
            usuarioOpt = usuarioRepository.findByTelefono(identifier);
            if (usuarioOpt.isEmpty()) {
                Optional<com.subasta.entity.Comprador> comp = compradorRepository.findAll().stream()
                        .filter(c -> identifier.equals(c.getTelefono()))
                        .findFirst();
                if (comp.isPresent() && comp.get().getUsuarioId() != null) {
                    usuarioOpt = usuarioRepository.findById(comp.get().getUsuarioId());
                } else {
                    Optional<com.subasta.entity.Vendedor> vend = vendedorRepository.findAll().stream()
                            .filter(v -> identifier.equals(v.getTelefono()))
                            .findFirst();
                    if (vend.isPresent() && vend.get().getUsuarioId() != null) {
                        usuarioOpt = usuarioRepository.findById(vend.get().getUsuarioId());
                    }
                }
            }
        }

        if (usuarioOpt.isEmpty()) {
            // Registrar intento fallido incluso para cuentas inexistentes (anti-enumeración)
            loginAttemptService.registerFailedAttempt(identifier);
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "error", "Credenciales incorrectas"
            ));
        }

        Usuario u = usuarioOpt.get();
        boolean passwordMatches = false;
        try {
            passwordMatches = passwordEncoder.matches(password, u.getPassword());
        } catch (Exception ignored) {}

        if (!passwordMatches) {
            loginAttemptService.registerFailedAttempt(identifier);
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "error", "Credenciales incorrectas"
            ));
        }

        // Login exitoso: limpiar contador de intentos fallidos
        loginAttemptService.clearAttempts(identifier);

        if (!isUserApproved(u)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "error", "Tus datos están en validación. Tu cuenta aún no ha sido aprobada por un administrador."
            ));
        }

        String accessToken = jwtService.createAccessToken(u.getEmail(), u.getRol());

        Map<String, Object> userData = new HashMap<>();
        userData.put("id", u.getId());
        userData.put("email", u.getEmail());
        userData.put("telefono", u.getTelefono());
        userData.put("rol", u.getRol());
        userData.put("activo", u.getActivo());

        if ("COMPRADOR".equalsIgnoreCase(u.getRol())) {
            compradorRepository.findByEmail(u.getEmail()).ifPresent(c -> {
                userData.put("folio", c.getFolio());
                userData.put("nombre", c.getNombres() != null ? (c.getNombres() + " " + (c.getApellidoPaterno() != null ? c.getApellidoPaterno() : "")) : c.getRazonSocial());
                userData.put("tipoPersona", c.getTipoPersona());
                userData.put("estatus", c.getEstatus());
                if (userData.get("telefono") == null) userData.put("telefono", c.getTelefono());
            });
        } else if ("VENDEDOR".equalsIgnoreCase(u.getRol())) {
            vendedorRepository.findByEmail(u.getEmail()).ifPresent(v -> {
                userData.put("folio", v.getFolio());
                userData.put("nombre", v.getNombres() != null ? (v.getNombres() + " " + (v.getApellidoPaterno() != null ? v.getApellidoPaterno() : "")) : v.getRazonSocial());
                userData.put("tipoPersona", v.getTipoPersona());
                userData.put("estatus", v.getEstatus());
                if (userData.get("telefono") == null) userData.put("telefono", v.getTelefono());
            });
        } else if ("APROBADOR".equalsIgnoreCase(u.getRol()) || "CONTROLER".equalsIgnoreCase(u.getRol()) || "ADMINISTRADOR".equalsIgnoreCase(u.getRol()) || "ADMIN".equalsIgnoreCase(u.getRol())) {
            userData.put("nombre", "ADMINISTRADOR".equalsIgnoreCase(u.getRol()) || "ADMIN".equalsIgnoreCase(u.getRol()) ? "Administrador Principal" : u.getRol() + " Oficial");
            userData.put("folio", "ADM-" + u.getId());
            userData.put("estatus", "APROBADO");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("accessToken", accessToken);
        response.put("user", userData);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/send-code")
    public ResponseEntity<?> sendCode(@Valid @RequestBody SendCodeRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (Boolean.TRUE.equals(request.getCheckDuplicate())
                && (usuarioRepository.existsByEmail(email)
                || compradorRepository.findByEmail(email).isPresent()
                || vendedorRepository.findByEmail(email).isPresent())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "success", false,
                    "error", "Ya existe un usuario registrado con este correo electrónico."
            ));
        }

        if (verificationCodeService.isCooldownActive(email)) {
            long remaining = verificationCodeService.getCooldownSecondsRemaining(email);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, String.valueOf(remaining))
                    .body(Map.of(
                            "success", false,
                            "error", "Por favor espera " + remaining + " segundos antes de solicitar un nuevo código."
                    ));
        }

        String challengeId = verificationCodeService.generateAndStoreCode(email);
        String code = verificationCodeService.getCodeForChallenge(challengeId);
        String challengeToken = jwtService.createChallengeToken(email, challengeId);

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
            String challengeId = claims.get("challengeId", String.class);

            com.subasta.service.VerificationCodeService.VerificationResult result =
                    verificationCodeService.verifyCode(challengeId, request.getCode(), email);

            if (result == com.subasta.service.VerificationCodeService.VerificationResult.INVALID_OR_EXPIRED) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "El código ha expirado o el token es inválido"
                ));
            } else if (result == com.subasta.service.VerificationCodeService.VerificationResult.MAX_ATTEMPTS_EXCEEDED) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Has superado el límite de intentos permitidos. Solicita un nuevo código."
                ));
            } else if (result == com.subasta.service.VerificationCodeService.VerificationResult.CODE_MISMATCH) {
                int remaining = verificationCodeService.getRemainingAttempts(challengeId);
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Código de verificación incorrecto. Intentos restantes: " + remaining
                ));
            }

            String verifiedEmailToken = jwtService.createVerifiedEmailToken(email);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("verified", true);
            response.put("email", email);
            response.put("verifiedEmailToken", verifiedEmailToken);

            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            if (usuarioOpt.isPresent()) {
                Usuario u = usuarioOpt.get();
                response.put("userExists", true);
                if (isUserApproved(u)) {
                    String accessToken = jwtService.createAccessToken(email, u.getRol());
                    response.put("accessToken", accessToken);
                } else {
                    response.put("pendingApproval", true);
                }

                Map<String, Object> userData = new HashMap<>();
                userData.put("id", u.getId());
                userData.put("email", u.getEmail());
                userData.put("rol", u.getRol());

                if ("COMPRADOR".equalsIgnoreCase(u.getRol())) {
                    compradorRepository.findByEmail(email).ifPresent(c -> {
                        userData.put("folio", c.getFolio());
                        userData.put("nombre", c.getNombres() != null ? (c.getNombres() + " " + (c.getApellidoPaterno() != null ? c.getApellidoPaterno() : "")) : c.getRazonSocial());
                        userData.put("tipoPersona", c.getTipoPersona());
                        userData.put("estatus", c.getEstatus());
                        userData.put("telefono", c.getTelefono());
                    });
                } else if ("VENDEDOR".equalsIgnoreCase(u.getRol())) {
                    vendedorRepository.findByEmail(email).ifPresent(v -> {
                        userData.put("folio", v.getFolio());
                        userData.put("nombre", v.getNombres() != null ? (v.getNombres() + " " + (v.getApellidoPaterno() != null ? v.getApellidoPaterno() : "")) : v.getRazonSocial());
                        userData.put("tipoPersona", v.getTipoPersona());
                        userData.put("estatus", v.getEstatus());
                        userData.put("telefono", v.getTelefono());
                    });
                }
                response.put("user", userData);
            } else {
                response.put("userExists", false);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "El código ha expirado o el token es inválido"
            ));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody SendCodeRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (verificationCodeService.isCooldownActive(email)) {
            long remaining = verificationCodeService.getCooldownSecondsRemaining(email);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, String.valueOf(remaining))
                    .body(Map.of(
                            "success", false,
                            "error", "Por favor espera " + remaining + " segundos antes de solicitar un nuevo código."
                    ));
        }

        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "error", "No existe una cuenta registrada con ese correo electrónico."
            ));
        }

        Usuario u = usuarioOpt.get();
        if (("COMPRADOR".equalsIgnoreCase(u.getRol()) || "VENDEDOR".equalsIgnoreCase(u.getRol())) && !isUserApproved(u)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "error", "Tu cuenta aún no ha sido aprobada. No es posible recuperar la contraseña hasta que sea aprobada."
            ));
        }

        String challengeId = verificationCodeService.generateAndStoreCode(email);
        String code = verificationCodeService.getCodeForChallenge(challengeId);
        String challengeToken = jwtService.createChallengeToken(email, challengeId);
        emailService.sendPasswordResetCode(email, code);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Código de verificación enviado a tu correo electrónico.",
                "challengeToken", challengeToken
        ));
    }

    private boolean isUserApproved(Usuario u) {
        String rol = u.getRol();
        if ("COMPRADOR".equalsIgnoreCase(rol)) {
            return compradorRepository.findByEmail(u.getEmail())
                    .map(c -> "APROBADO".equalsIgnoreCase(c.getEstatus()))
                    .orElseGet(() -> "APROBADO".equalsIgnoreCase(u.getEstatus()) && Boolean.TRUE.equals(u.getActivo()));
        }
        if ("VENDEDOR".equalsIgnoreCase(rol)) {
            return vendedorRepository.findByEmail(u.getEmail())
                    .map(v -> "APROBADO".equalsIgnoreCase(v.getEstatus()))
                    .orElseGet(() -> "APROBADO".equalsIgnoreCase(u.getEstatus()) && Boolean.TRUE.equals(u.getActivo()));
        }
        return Boolean.TRUE.equals(u.getActivo());
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyResetCode(@Valid @RequestBody VerifyCodeRequest request) {
        try {
            Claims claims = jwtService.parseToken(request.getChallengeToken());
            if (!"CHALLENGE_CODE".equals(claims.get("type", String.class))) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Tipo de token inválido para verificación de código"
                ));
            }

            String email = claims.getSubject();
            String challengeId = claims.get("challengeId", String.class);

            com.subasta.service.VerificationCodeService.VerificationResult result =
                    verificationCodeService.verifyCode(challengeId, request.getCode(), email);

            if (result == com.subasta.service.VerificationCodeService.VerificationResult.INVALID_OR_EXPIRED) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "El código ha expirado o el token es inválido"
                ));
            } else if (result == com.subasta.service.VerificationCodeService.VerificationResult.MAX_ATTEMPTS_EXCEEDED) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Has superado el límite de intentos permitidos. Solicita un nuevo código."
                ));
            } else if (result == com.subasta.service.VerificationCodeService.VerificationResult.CODE_MISMATCH) {
                int remaining = verificationCodeService.getRemainingAttempts(challengeId);
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Código de verificación incorrecto. Intentos restantes: " + remaining,
                        "attemptsRemaining", remaining
                ));
            }

            String resetToken = jwtService.createPasswordResetToken(email);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "verified", true,
                    "resetToken", resetToken,
                    "message", "Código verificado exitosamente"
            ));
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "El tiempo para ingresar el código ha expirado. Solicita uno nuevo."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Token de desafío inválido o alterado"
            ));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            Claims claims = jwtService.parseToken(request.getResetToken());
            if (!"PASSWORD_RESET".equals(claims.get("type", String.class))) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Token de recuperación inválido o no autorizado"
                ));
            }

            String email = claims.getSubject();
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

            if (usuarioOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Usuario no encontrado"
                ));
            }

            Usuario usuario = usuarioOpt.get();
            usuario.setPassword(passwordEncoder.encode(request.getNewPassword()));
            usuarioRepository.save(usuario);

            // Limpiar bloqueos de fuerza bruta
            loginAttemptService.clearAttempts(email);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña."
            ));
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "El token de recuperación ha expirado. Solicita un nuevo código."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Token de recuperación inválido o manipulado"
            ));
        }
    }
}
