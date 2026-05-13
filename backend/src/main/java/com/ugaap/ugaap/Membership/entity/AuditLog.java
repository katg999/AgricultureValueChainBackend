package com.ugaap.ugaap.Membership.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "audit_logs")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    private String action;      // e.g., MEMBERSHIP_APPROVE
    private String performedBy; // Username
    private UUID cooperativeId;
    private String details;     // Resource IDs or changes
    private LocalDateTime timestamp;
}

@Entity
@Table(name = "sacco_configs")
@Data @NoArgsConstructor
public class SaccoConfig {
    @Id @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @OneToOne
    private Cooperative cooperative;

    // Business Process Flags
    private boolean requireMfaForApprovals = true;
    private boolean allowManagerOnboarding = true; // Business Process Config

    public boolean isEnforceMakerCheckerForStaff() {
        return enforceMakerCheckerForStaff;
    }

    public void setEnforceMakerCheckerForStaff(boolean enforceMakerCheckerForStaff) {
        this.enforceMakerCheckerForStaff = enforceMakerCheckerForStaff;
    }
}