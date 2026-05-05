package com.ugaap.ugaap.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for starting password reset.
 */
@Data
public class PasswordResetRequest {

    /** Email address of the account that needs a password reset. */
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
}
