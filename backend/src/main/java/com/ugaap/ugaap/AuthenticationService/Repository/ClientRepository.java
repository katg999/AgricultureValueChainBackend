package com.ugaap.ugaap.AuthenticationService.Repository;

import com.ugaap.ugaap.AuthenticationService.Entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import com.ugaap.ugaap.Membership.entity.Cooperative;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClientRepository extends JpaRepository<Client, UUID> {

    Optional<Client> findByEmail(String email);

    boolean existsByEmail(String email);

    // Crucial for Multi-tenancy: Only fetch users for the specific Sacco
    List<Client> findByCooperative(Cooperative cooperative);

    List<Client> findFarmersByManagerHierarchy(UUID managerId);
}