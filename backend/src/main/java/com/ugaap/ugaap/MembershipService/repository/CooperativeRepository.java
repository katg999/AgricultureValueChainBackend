package com.ugaap.ugaap.MembershipService.repository;

import com.ugaap.ugaap.MembershipService.Entity.Cooperative;     //Changing Cooperative to import Membership now as Cooperative is now in Membership
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CooperativeRepository extends JpaRepository<Cooperative, UUID> {

    Optional<Cooperative> findByTenantId(String tenantId);


    Optional<Cooperative> findByRegistrationNumber(String registrationNumber);

    boolean existsByRegistrationNumber(String registrationNumber);

    boolean existsByTenantId(String tenantId);
}