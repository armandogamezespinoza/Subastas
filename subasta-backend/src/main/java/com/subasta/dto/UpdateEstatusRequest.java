package com.subasta.dto;

public class UpdateEstatusRequest {
    private String estatus; // "EN_REVISION" | "APROBADO" | "RECHAZADO"
    private String motivo;  // opcional, para rechazos

    public UpdateEstatusRequest() {}

    public String getEstatus() { return estatus; }
    public void setEstatus(String estatus) { this.estatus = estatus; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}
