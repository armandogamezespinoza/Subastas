package com.subasta.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class SendCodeRequest {

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "Formato de correo inválido")
    private String email;

    private Boolean checkDuplicate = false;

    public SendCodeRequest() {}
    public SendCodeRequest(String email) { this.email = email; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Boolean getCheckDuplicate() { return checkDuplicate; }
    public void setCheckDuplicate(Boolean checkDuplicate) { this.checkDuplicate = checkDuplicate; }
}
