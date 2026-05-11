package com.ugaap.ugaap.Membership.domain;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

/**
 * Manages Sacco-wide Business Process Configurations.
 * Defines rules like Maker-Checker requirements for the Cooperative.
 */
@Entity
@Table(name = "sacco_configs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class SaccoConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    /**
     * Links config to a specific Cooperative (Tenant).
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cooperative_id", nullable = false)
    private Cooperative cooperative;

    /**
     * Business Process Toggle: Maker-Checker on Staff Onboarding.
     * If true, a created manager remains PENDING until approved by another admin.
    */
    @Column(nullable = false)
    private boolean enforceMakerCheckerForStaff = true;
    private boolean requireMfaForApprovals = true;
    private boolean allowManagerOnboarding = true;
}