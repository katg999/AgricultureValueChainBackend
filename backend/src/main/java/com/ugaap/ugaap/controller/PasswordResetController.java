package com.ugaap.ugaap.controller;

import com.ugaap.ugaap.dto.ApiResponse;
import com.ugaap.ugaap.dto.CompletePasswordResetRequest;
import com.ugaap.ugaap.dto.PasswordResetRequest;
import com.ugaap.ugaap.service.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public password reset endpoints.
 *
 * These endpoints must be accessible without a JWT because users who forgot
 * their password cannot log in yet.
 */
@RestController
@RequestMapping("/auth/password-reset")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    /**
     * Starts password reset.
     *
     * Always returns the same message to avoid revealing whether the email is
     * registered.
     */
    @PostMapping("/request")
    public ResponseEntity<ApiResponse<Void>> requestPasswordReset(
            @Valid @RequestBody PasswordResetRequest request,
            HttpServletRequest httpRequest) {

        passwordResetService.requestPasswordReset(request, httpRequest);

        return ResponseEntity.ok(ApiResponse.ok(
                "If this account exists, reset instructions were sent.",
                null
        ));
    }

    /**
     * Completes password reset with resetId, email, code, and new password.
     */
    @PostMapping("/complete")
    public ResponseEntity<ApiResponse<Void>> completePasswordReset(
            @Valid @RequestBody CompletePasswordResetRequest request,
            HttpServletRequest httpRequest) {

        boolean success = passwordResetService.completePasswordReset(request, httpRequest);

        if (!success) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Invalid or expired reset request."
            ));
        }

        return ResponseEntity.ok(ApiResponse.ok(
                "Password reset successful.",
                null
        ));
    }
}
