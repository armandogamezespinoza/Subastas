package com.subasta.controller;

import com.subasta.dto.SendCodeRequest;
import com.subasta.dto.VerifyCodeRequest;
import com.subasta.entity.Usuario;
import com.subasta.repository.CompradorRepository;
import com.subasta.repository.UsuarioRepository;
import com.subasta.repository.VendedorRepository;
import com.subasta.security.JwtService;
import com.subasta.service.EmailService;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final JwtService jwtService;
    private final EmailService emailService;
    private final UsuarioRepository usuarioRepository;
    private final CompradorRepository compradorRepository;
    private final VendedorRepository vendedorRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public AuthController(JwtService jwtService,
                          EmailService emailService,
                          UsuarioRepository usuarioRepository,
                          CompradorRepository compradorRepository,
                          VendedorRepository vendedorRepository,
                          org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.jwtService = jwtService;
        this.emailService = emailService;
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
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "error", "Usuario no encontrado con ese correo o teléfono"
            ));
        }

        Usuario u = usuarioOpt.get();
        boolean passwordMatches = false;
        try {
            passwordMatches = passwordEncoder.matches(password, u.getPassword());
        } catch (Exception ignored) {}

        if (!passwordMatches && password.equals(u.getPassword())) {
            passwordMatches = true;
        }

        if (!passwordMatches) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "error", "Contraseña incorrecta"
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

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("verified", true);
            response.put("email", email);
            response.put("verifiedEmailToken", verifiedEmailToken);

            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            if (usuarioOpt.isPresent()) {
                Usuario u = usuarioOpt.get();
                String accessToken = jwtService.createAccessToken(email, u.getRol());
                response.put("userExists", true);
                response.put("accessToken", accessToken);

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
}
