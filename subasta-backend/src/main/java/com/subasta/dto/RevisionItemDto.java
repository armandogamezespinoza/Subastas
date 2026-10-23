package com.subasta.dto;

import java.time.LocalDateTime;

public class RevisionItemDto {

    private Long id;
    private String folio;
    private String tipo;           // "COMPRADOR" | "VENDEDOR"
    private String tipoPersona;    // "FISICA" | "MORAL"
    private String nombre;         // nombre completo o razón social
    private String rfc;
    private String email;
    private String telefono;
    private String estatus;        // "ENVIADO" | "EN_REVISION" | "APROBADO" | "RECHAZADO"
    private java.time.LocalDateTime fechaCreacion;
    private int totalDocumentos;

    public RevisionItemDto() {}

    public RevisionItemDto(Long id, String folio, String tipo, String tipoPersona,
                           String nombre, String rfc, String email, String telefono,
                           String estatus, java.time.LocalDateTime fechaCreacion, int totalDocumentos) {
        this.id = id;
        this.folio = folio;
        this.tipo = tipo;
        this.tipoPersona = tipoPersona;
        this.nombre = nombre;
        this.rfc = rfc;
        this.email = email;
        this.telefono = telefono;
        this.estatus = estatus;
        this.fechaCreacion = fechaCreacion;
        this.totalDocumentos = totalDocumentos;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFolio() { return folio; }
    public void setFolio(String folio) { this.folio = folio; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getTipoPersona() { return tipoPersona; }
    public void setTipoPersona(String tipoPersona) { this.tipoPersona = tipoPersona; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getRfc() { return rfc; }
    public void setRfc(String rfc) { this.rfc = rfc; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getEstatus() { return estatus; }
    public void setEstatus(String estatus) { this.estatus = estatus; }
    public java.time.LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(java.time.LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    public int getTotalDocumentos() { return totalDocumentos; }
    public void setTotalDocumentos(int totalDocumentos) { this.totalDocumentos = totalDocumentos; }
}
