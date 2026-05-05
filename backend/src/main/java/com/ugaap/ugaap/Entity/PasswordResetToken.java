package com.ugaap.ugaap.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Stores one password reset request for one client account.
 *
 * Security note:
 * The plain 6-digit reset code is never stored. Only its BCrypt hash is stored.
 */
@Entity
@Table(name = "password_reset_tokens", indexes = {
        @Index(name = "idx_password_reset_reset_id", columnList = "reset_id"),
        @Index(name = "idx_password_reset_email", columnList = "email"),
        @Index(name = "idx_password_reset_expires_at", columnList = "expires_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {

    /** Internal database id for this reset record. */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /**
     * Public reset identifier.
     *
     * This is used to find the reset record, but it is not the secret code.
     */
    @Column(name = "reset_id", nullable = false, unique = true, length = 64)
    private String resetId;

    /** Lowercase and trimmed client email. */
    @Column(name = "email", nullable = false, length = 320)
    private String email;

    /** BCrypt hash of the secret 6-digit reset code. */
    @Column(name = "code_hash", nullable = false)
    private String codeHash;

    /** When this reset request becomes invalid. */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /** Number of failed code/email verification attempts. */
    @Column(name = "verification_attempts", nullable = false)
    private int verificationAttempts;

    /** Current lifecycle status of the reset request. */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PasswordResetStatus status;

    /** When the reset request was created. */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** When the reset request was last updated. */
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Returns true only while the token is still open for verification. */
    public boolean isActive() {
        return status == PasswordResetStatus.ACTIVE;
    }

    /** Password reset token lifecycle states. */
    public enum PasswordResetStatus {
        ACTIVE,
        USED,
        LOCKED,
        EXPIRED
    }
}
