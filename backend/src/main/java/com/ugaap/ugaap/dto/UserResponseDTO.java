package com.ugaap.ugaap.dto;

import com.ugaap.ugaap.AuthenticationService.Entity.Client;
import com.ugaap.ugaap.Membership.contoller.MembershipController;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDTO {
    private UUID id;
    private String email;
    private String companyName;
    private String status;
    private String cooperativeName; // Flattened for easy UI display
    private boolean isApproved;

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers(@RequestAttribute("currentUser") Client admin) {
        // Now returns secure DTOs instead of raw Client entities
        MembershipController membershipService = new MembershipController();
        return ResponseEntity.ok(membershipService.findAllByCooperative(admin.getCooperative()));
    }
}

