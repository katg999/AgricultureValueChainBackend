package com.ugaap.membership.repository;

import com.ugaap.membership.Entity.Branch;
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
    List<Branch> findAllByTenantId(String tenantId);

    boolean existsByBranchCode(String branchCode);

    boolean existsByBranchCodeAndTenantId(String branchCode, String tenantId);

    @Query("SELECT b FROM Branch b WHERE b.cooperative.cooperativeId = :cooperativeId")
    List<Branch> findByCooperativeId(UUID cooperativeId);
}
