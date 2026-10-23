package com.subasta.dto;

import jakarta.validation.constraints.NotBlank;

public class VerifyCodeRequest {

    @NotBlank(message = "El código es obligatorio")
    private String code;

    @NotBlank(message = "El token de desafío es obligatorio")
    private String challengeToken;

    public VerifyCodeRequest() {}
    public VerifyCodeRequest(String code, String challengeToken) {
        this.code = code;
        this.challengeToken = challengeToken;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getChallengeToken() { return challengeToken; }
    public void setChallengeToken(String challengeToken) { this.challengeToken = challengeToken; }
}
