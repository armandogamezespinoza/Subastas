package com.subasta.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendedores")
public class Vendedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 30, unique = true)
    private String folio;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 15)
    private String telefono;

    @Column(name = "tipo_persona", nullable = false, length = 10)
    private String tipoPersona;

    @Column(length = 100)
    private String nombres;

    @Column(name = "apellido_paterno", length = 100)
    private String apellidoPaterno;

    @Column(name = "apellido_materno", length = 100)
    private String apellidoMaterno;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(length = 18)
    private String curp;

    @Column(name = "fecha_inicio_actividades")
    private LocalDate fechaInicioActividades;

    @Column(name = "regimen_fiscal", length = 10)
    private String regimenFiscal;

    @Column(name = "actividad_economica", length = 200)
    private String actividadEconomica;

    @Column(name = "razon_social", length = 200)
    private String razonSocial;

    @Column(name = "fecha_constitucion")
    private LocalDate fechaConstitucion;

    @Column(name = "numero_notaria", length = 50)
    private String numeroNotaria;

    @Column(name = "numero_escritura", length = 50)
    private String numeroEscritura;

    @Column(name = "correo_corporativo", length = 150)
    private String correoCorporativo;

    @Column(name = "correo_contador", length = 150)
    private String correoContador;

    @Column(name = "rep_nombre", length = 150)
    private String repNombre;

    @Column(name = "rep_rfc", length = 13)
    private String repRfc;

    @Column(length = 13)
    private String rfc;

    @Column(nullable = false, length = 150)
    private String calle;

    @Column(nullable = false, length = 50)
    private String numero;

    @Column(name = "codigo_postal", nullable = false, length = 5)
    private String codigoPostal;

    @Column(nullable = false, length = 100)
    private String colonia;

    @Column(nullable = false, length = 100)
    private String ciudad;

    @Column(nullable = false, length = 100)
    private String municipio;

    @Column(nullable = false, length = 100)
    private String estado;

    @Column(length = 50)
    private String pais = "México";

    @Column(name = "domicilio_operacion", length = 255)
    private String domicilioOperacion;

    @Column(length = 30)
    private String estatus = "ENVIADO";

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    public Vendedor() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFolio() { return folio; }
    public void setFolio(String folio) { this.folio = folio; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getTipoPersona() { return tipoPersona; }
    public void setTipoPersona(String tipoPersona) { this.tipoPersona = tipoPersona; }

    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }

    public String getApellidoPaterno() { return apellidoPaterno; }
    public void setApellidoPaterno(String apellidoPaterno) { this.apellidoPaterno = apellidoPaterno; }

    public String getApellidoMaterno() { return apellidoMaterno; }
    public void setApellidoMaterno(String apellidoMaterno) { this.apellidoMaterno = apellidoMaterno; }

    public LocalDate getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(LocalDate fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }

    public String getCurp() { return curp; }
    public void setCurp(String curp) { this.curp = curp; }

    public LocalDate getFechaInicioActividades() { return fechaInicioActividades; }
    public void setFechaInicioActividades(LocalDate fechaInicioActividades) { this.fechaInicioActividades = fechaInicioActividades; }

    public String getRegimenFiscal() { return regimenFiscal; }
    public void setRegimenFiscal(String regimenFiscal) { this.regimenFiscal = regimenFiscal; }

    public String getActividadEconomica() { return actividadEconomica; }
    public void setActividadEconomica(String actividadEconomica) { this.actividadEconomica = actividadEconomica; }

    public String getRazonSocial() { return razonSocial; }
    public void setRazonSocial(String razonSocial) { this.razonSocial = razonSocial; }

    public LocalDate getFechaConstitucion() { return fechaConstitucion; }
    public void setFechaConstitucion(LocalDate fechaConstitucion) { this.fechaConstitucion = fechaConstitucion; }

    public String getNumeroNotaria() { return numeroNotaria; }
    public void setNumeroNotaria(String numeroNotaria) { this.numeroNotaria = numeroNotaria; }

    public String getNumeroEscritura() { return numeroEscritura; }
    public void setNumeroEscritura(String numeroEscritura) { this.numeroEscritura = numeroEscritura; }

    public String getCorreoCorporativo() { return correoCorporativo; }
    public void setCorreoCorporativo(String correoCorporativo) { this.correoCorporativo = correoCorporativo; }

    public String getCorreoContador() { return correoContador; }
    public void setCorreoContador(String correoContador) { this.correoContador = correoContador; }

    public String getRepNombre() { return repNombre; }
    public void setRepNombre(String repNombre) { this.repNombre = repNombre; }

    public String getRepRfc() { return repRfc; }
    public void setRepRfc(String repRfc) { this.repRfc = repRfc; }

    public String getRfc() { return rfc; }
    public void setRfc(String rfc) { this.rfc = rfc; }

    public String getCalle() { return calle; }
    public void setCalle(String calle) { this.calle = calle; }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getCodigoPostal() { return codigoPostal; }
    public void setCodigoPostal(String codigoPostal) { this.codigoPostal = codigoPostal; }

    public String getColonia() { return colonia; }
    public void setColonia(String colonia) { this.colonia = colonia; }

    public String getCiudad() { return ciudad; }
    public void setCiudad(String ciudad) { this.ciudad = ciudad; }

    public String getMunicipio() { return municipio; }
    public void setMunicipio(String municipio) { this.municipio = municipio; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getPais() { return pais; }
    public void setPais(String pais) { this.pais = pais; }

    public String getDomicilioOperacion() { return domicilioOperacion; }
    public void setDomicilioOperacion(String domicilioOperacion) { this.domicilioOperacion = domicilioOperacion; }

    public String getEstatus() { return estatus; }
    public void setEstatus(String estatus) { this.estatus = estatus; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
}
