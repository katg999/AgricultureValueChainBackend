package com.ugaap.ugaap.InventoryService.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

// Branch entity - local copy synced from MembershipService
// Full branch management is done by MembershipService; we keep minimal info here for inventory
@Entity
@Table(name = "branches")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Branch {
    @Id
    @GeneratedValue
    private UUID id;

    // Branch code for easy reference (auto-generated if not provided)
    @Column(name = "code", nullable = false, unique = true)
    private String code;

    // Branch name - searchable
    @Column(name = "name", nullable = false)
    private String name;

    // Reference to parent cooperative
    @Column(name = "cooperative_id", nullable = false)
    private UUID cooperativeId;

    // Branch location/address
    @Column(name = "location")
    private String location;
    
    // Record creation timestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Auto-generate short code on persist
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (code == null || code.isEmpty()) {
            code = generateShortCode();
        }
    }

    // Generate a short 8-character alphanumeric code for easy reference
    private String generateShortCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            int idx = (int) (Math.random() * chars.length());
            sb.append(chars.charAt(idx));
        }
        return sb.toString();
    }
}