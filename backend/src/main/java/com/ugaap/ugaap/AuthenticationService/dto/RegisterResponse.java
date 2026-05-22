package com.ugaap.ugaap.AuthenticationService.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegisterResponse {
    private String clientId;
    private String email;
    private String companyName;
    private String role;
    private String status;
    private String createdAt;
}