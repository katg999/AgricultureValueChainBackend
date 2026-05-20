package com.ugaap.ugaap.MembershipService.repository;

import com.ugaap.ugaap.MembershipService.Entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


@Repository
public interface BranchRepository extends JpaRepository<Branch, UUID> {

    List<Branch> findByTenantId(String tenantId);

    Optional<Branch> findByBranchCode(String branchCode);

    boolean existsByBranchCode(String branchCode);

    boolean existsByBranchCodeAndTenantId(String branchCode, String tenantId);

    @Query("SELECT b FROM Branch b WHERE b.cooperative.cooperativeId = :cooperativeId")
    List<Branch> findByCooperativeId(UUID cooperativeId);
}
