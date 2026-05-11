package com.ugaap.ugaap.Membership.repository;

import com.ugaap.ugaap.Membership.domain.SaccoConfig;
import com.ugaap.ugaap.Membership.domain.Cooperative;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Standard Spring Data JPA Repository.
 * Replaces the ScopedValue implementation to allow database interaction.
 */
@Repository
public interface SaccoConfigRepository extends JpaRepository<SaccoConfig, UUID> {

    /**
     * Finds the business process configuration for a specific cooperative.
     * Used by MembershipService to determine Maker-Checker requirements.
     */
    Optional<SaccoConfig> findByCooperative(Cooperative cooperative);
}