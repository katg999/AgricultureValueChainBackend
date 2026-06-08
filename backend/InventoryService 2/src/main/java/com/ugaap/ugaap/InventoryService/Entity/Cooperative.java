package com.ugaap.ugaap.InventoryService.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

// Cooperative entity - local copy synced from MembershipService
// Full cooperative management is done by MembershipService; we keep minimal info here for inventory
@Entity
@Table(name = "cooperatives")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Cooperative {
    @Id
    @GeneratedValue
    private UUID id;

    // Cooperative code for easy reference (auto-generated in MembershipService)
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    // Cooperative name - searchable
    @Column(nullable = false)
    private String name;

    private String description;
    private String email;
    private String phone;

    // Record creation timestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}