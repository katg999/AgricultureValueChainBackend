package com.ugaap.membership.Entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "members", schema = "membership")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "member_id", updatable = false, nullable = false)
    private UUID memberId;

    // ── Personal Details ──────────────────────────────────────

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "national_id", unique = true, nullable = false)
    private String nationalId;

    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false)
    private Gender gender;

    @Column(name = "email")
    private String email;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "profile_photo_url")
    private String profilePhotoUrl;

    // ── Location Details ──────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "farm_region", nullable = false)
    private FarmRegion farmRegion;

    @Column(name = "village_town")
    private String villageTown;

    // ── Farm Details ──────────────────────────────────────────

    @Column(name = "total_land_area_hectares",
            precision = 10, scale = 2)
    private BigDecimal totalLandAreaHectares;

    @Enumerated(EnumType.STRING)
    @Column(name = "land_ownership_type")
    private LandOwnershipType landOwnershipType;

    // ── Production Details ────────────────────────────────────

    @ElementCollection
    @CollectionTable(
            name = "member_crops",
            schema = "membership",
            joinColumns = @JoinColumn(name = "member_id")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "crop")
    private List<PrimaryCrop> primaryCrops;

    @Column(name = "cattle_count", nullable = false)
    @Builder.Default
    private int cattleCount = 0;

    @Column(name = "goats_count", nullable = false)
    @Builder.Default
    private int goatsCount = 0;

    @Column(name = "poultry_count", nullable = false)
    @Builder.Default
    private int poultryCount = 0;

    // ── Cooperative Assignment ────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cooperative_id", nullable = false)
    private Cooperative cooperative;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    // ── Metadata ──────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private MemberStatus status;

    @Column(name = "registered_by")
    private String registeredBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Enums ─────────────────────────────────────────────────

    public enum Gender {
        MALE, FEMALE, OTHER
    }

    public enum FarmRegion {
        CENTRAL, EAST, WEST, NORTH
    }

    public enum LandOwnershipType {
        OWNED, LEASED, COMMUNAL, FAMILY_LAND
    }

    public enum PrimaryCrop {
        COFFEE, MAIZE, COCOA, VANILLA
    }

    public enum MemberStatus {
        ACTIVE, INACTIVE, SUSPENDED
    }
}