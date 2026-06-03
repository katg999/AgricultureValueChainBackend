package com.ugaap.ugaap.InventoryService.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

// Farmer entity - local reference synced from MembershipService
// Full farmer management is done by MembershipService; we keep minimal info here for allocations
@Entity
@Table(name = "farmers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Farmer {
    @Id
    @GeneratedValue
    private UUID id;

    // Farmer first name - searchable
    @Column(name = "first_name")
    private String firstName;

    // Farmer last name
    @Column(name = "last_name")
    private String lastName;

    // Short code for easy reference (auto-generated in MembershipService)
    @Column(name = "short_code")
    private String shortCode;

    // Record creation timestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Convenience method to get full name
    public String getName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        }
        return firstName != null ? firstName : (lastName != null ? lastName : "");
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}