package com.ugaap.ugaap.AuthenticationService.Entity;

import com.ugaap.ugaap.Membership.entity.Cooperative;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "clients")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

   @Column(name = "password_hash", nullable = false)
   private String passwordHash;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private ClientRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ClientStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cooperative_id")
    private Cooperative cooperative; // Fixes 'cannot resolve cooperative'

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "onboarded_by_id")
    private Client onboardedBy; // Fixes 'cannot resolve onboardedBy'

    
    @Column(name = "is_approved")
    private boolean approvedByAdmin;

    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;



    public boolean isLocked() {
        return lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now());
    }

    public boolean isActive() {
        return status == ClientStatus.ACTIVE;
    }

    public void setStatus(String active) {
    }

    public void setApprovedByAdmin(boolean b) {
    }

    public Cooperative getCooperative() {
        return cooperative;
    }

    public void setCooperative(Object cooperative) {
        this.cooperative = (Cooperative) cooperative;
    }


    public enum ClientRole {
        CLIENT,       
        ADMIN,
        AUDITOR
    }

    public enum ClientStatus {
        ACTIVE,
        INACTIVE,
        SUSPENDED
    }
}