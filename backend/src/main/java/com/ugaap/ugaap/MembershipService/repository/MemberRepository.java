package com.ugaap.ugaap.MembershipService.repository;

import com.ugaap.ugaap.MembershipService.Entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MemberRepository extends JpaRepository<Member, UUID> {

    boolean existsByNationalId(String nationalId);

    Optional<Member> findByNationalId(String nationalId);

    List<Member> findAllByTenantId(String tenantId);

    List<Member> findAllByTenantIdAndBranchId(
            String tenantId, UUID branchId);

    long countByTenantId(String tenantId);

    long countByTenantIdAndBranchId(String tenantId, UUID branchId);
}