package com.ugaap.ugaap.Repository;

import com.ugaap.ugaap.Entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Database access for password reset records.
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    /** Finds a reset request by the public reset id sent to the client. */
    Optional<PasswordResetToken> findByResetId(String resetId);

    /** Deletes expired reset records during scheduled cleanup. */
    long deleteByExpiresAtBefore(LocalDateTime now);
}
