package com.subasta.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "usuarios")
public class Usuario {

    /**
     * Los 4 roles del sistema de subastas:
     * - ADMINISTRADOR: permisos totales sobre la plataforma.
     * - APROBADOR: puede cambiar estatus de Comprador a Vendedor desde el panel de solicitudes.
     * - COMPRADOR: rol asignado por defecto en todo nuevo registro.
     * - VENDEDOR: elevado desde COMPRADOR por un APROBADOR o ADMINISTRADOR.
     */
    public static final Set<String> VALID_ROLES = Set.of(
            "ADMINISTRADOR",
            "ADMIN",
            "APROBADOR",
            "COMPRADOR",
            "VENDEDOR"
    );

    public static String normalizeRole(String role) {
        if (role == null) return "COMPRADOR";
        String r = role.trim().toUpperCase();
        if ("ADMIN".equals(r) || "ADMINISTRATOR".equals(r)) return "ADMINISTRADOR";
        return r;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 30)
    private String telefono;

    @Column(nullable = false, length = 30)
    private String rol = "COMPRADOR";

    private Boolean activo = true;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    public Usuario() {}

    public Usuario(Long id, String email, String password, String rol, Boolean activo, LocalDateTime fechaCreacion) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.rol = (rol != null && VALID_ROLES.contains(rol.toUpperCase())) ? rol.toUpperCase() : "COMPRADOR";
        this.activo = activo != null ? activo : true;
        this.fechaCreacion = fechaCreacion != null ? fechaCreacion : LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getRol() { return normalizeRole(rol); }
    public void setRol(String rol) {
        if (rol != null) {
            String norm = normalizeRole(rol);
            if (VALID_ROLES.contains(norm)) {
                this.rol = norm;
            }
        }
    }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
}
