package com.subasta.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "compradores")
public class Comprador {

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

    @Column(name = "contacto_emergencia", length = 150)
    private String contactoEmergencia;

    @Column(name = "razon_social", length = 200)
    private String razonSocial;

    @Column(name = "fecha_constitucion")
    private LocalDate fechaConstitucion;

    @Column(name = "rfc_representante", length = 13)
    private String rfcRepresentante;

    @Column(name = "correo_corporativo", length = 150)
    private String correoCorporativo;

    @Column(name = "contacto_compras", length = 150)
    private String contactoCompras;

    @Column(length = 13)
    private String rfc;

    @Column(nullable = false, length = 200)
    private String calle;

    @Column(name = "codigo_postal", nullable = false, length = 5)
    private String codigoPostal;

    @Column(length = 100)
    private String colonia;

    @Column(length = 100)
    private String ciudad;

    @Column(nullable = false, length = 100)
    private String estado;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    public Comprador() {}

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

    public String getContactoEmergencia() { return contactoEmergencia; }
    public void setContactoEmergencia(String contactoEmergencia) { this.contactoEmergencia = contactoEmergencia; }

    public String getRazonSocial() { return razonSocial; }
    public void setRazonSocial(String razonSocial) { this.razonSocial = razonSocial; }

    public LocalDate getFechaConstitucion() { return fechaConstitucion; }
    public void setFechaConstitucion(LocalDate fechaConstitucion) { this.fechaConstitucion = fechaConstitucion; }

    public String getRfcRepresentante() { return rfcRepresentante; }
    public void setRfcRepresentante(String rfcRepresentante) { this.rfcRepresentante = rfcRepresentante; }

    public String getCorreoCorporativo() { return correoCorporativo; }
    public void setCorreoCorporativo(String correoCorporativo) { this.correoCorporativo = correoCorporativo; }

    public String getContactoCompras() { return contactoCompras; }
    public void setContactoCompras(String contactoCompras) { this.contactoCompras = contactoCompras; }

    public String getRfc() { return rfc; }
    public void setRfc(String rfc) { this.rfc = rfc; }

    public String getCalle() { return calle; }
    public void setCalle(String calle) { this.calle = calle; }

    public String getCodigoPostal() { return codigoPostal; }
    public void setCodigoPostal(String codigoPostal) { this.codigoPostal = codigoPostal; }

    public String getColonia() { return colonia; }
    public void setColonia(String colonia) { this.colonia = colonia; }

    public String getCiudad() { return ciudad; }
    public void setCiudad(String ciudad) { this.ciudad = ciudad; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
}
