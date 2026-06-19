package com.ugaap.configuration.repository;

import com.ugaap.configuration.entity.BranchPrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BranchPriceRepository extends JpaRepository<BranchPrice, UUID> {
    List<BranchPrice> findAllByBranchId(UUID branchId);
    List<BranchPrice> findAllByBranchIdIsNull();         // global prices
    Optional<BranchPrice> findByGradeIdAndBranchId(UUID gradeId, UUID branchId);
    Optional<BranchPrice> findByGradeIdAndBranchIdIsNull(UUID gradeId); // global
}