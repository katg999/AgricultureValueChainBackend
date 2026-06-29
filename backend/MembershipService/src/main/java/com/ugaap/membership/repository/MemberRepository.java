package com.ugaap.membership.repository;

import com.ugaap.membership.Entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    // ── Farmer search for collection agents ──────────────────
    // MemberRepository.java - add this method
    @Query("""
    SELECT m FROM Member m
    JOIN FETCH m.cooperative
    WHERE m.status = :status
    AND m.commodityToDeliver IS NOT NULL
    AND LOWER(m.fullName) LIKE LOWER(CONCAT('%', :query, '%'))
    ORDER BY m.fullName ASC
    """)
    List<Member> searchFarmersByName(
            @Param("query") String query,
            @Param("status") Member.MemberStatus status
    );
}