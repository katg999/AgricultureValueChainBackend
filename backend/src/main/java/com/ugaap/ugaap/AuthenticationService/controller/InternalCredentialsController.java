package com.ugaap.ugaap.AuthenticationService.controller;

import com.ugaap.ugaap.AuthenticationService.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/internal/credentials")
@RequiredArgsConstructor
public class InternalCredentialsController {

    private final AuthService authService;

    @PostMapping
    public ResponseEntity<ProvisionResponse> provision(
            @Valid @RequestBody ProvisionRequest request) {

        AuthService.CredentialsResult result = authService.provisionCredentials(
                UUID.fromString(request.getUserId()),
                request.getUsername(),
                request.getEmail(),
                request.getPlainPassword()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ProvisionResponse(
                        result.userId().toString(),
                        result.username(),
                        result.email()
                ));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deactivate(@PathVariable String userId) {
        authService.deactivateCredentials(UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }

    // ── DTOs ──────────────────────────────────────────────────

    @Data
    public static class ProvisionRequest {
        @NotBlank private String userId;
        @NotBlank private String username;
        @NotBlank private String email;
        @NotBlank private String plainPassword;
    }

    public record ProvisionResponse(
            String userId,
            String username,
            String email
    ) {}
}