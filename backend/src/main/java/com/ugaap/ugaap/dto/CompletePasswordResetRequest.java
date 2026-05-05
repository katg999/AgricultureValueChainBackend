package com.ugaap.ugaap.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for completing password reset.
 */
@Data
public class CompletePasswordResetRequest {

    /** Public reset id sent with the reset instructions. */
    @NotBlank(message = "Reset ID is required")
    private String resetId;

    /** Email address for the account being reset. */
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    /** Secret 6-digit code sent to the client. */
    @NotBlank(message = "Code is required")
    @Pattern(regexp = "\\d{6}", message = "Code must be exactly 6 digits")
    private String code;

    /** New password to store as a BCrypt hash. */
    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
    private String newPassword;
}
