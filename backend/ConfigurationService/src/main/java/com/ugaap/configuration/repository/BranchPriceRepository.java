package com.ugaap.configuration.repository;

import com.ugaap.configuration.entity.BranchPrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BranchPriceRepository extends JpaRepository<BranchPrice, UUID> {

    List<BranchPrice> findAllByBranchName(String branchName);
    List<BranchPrice> findAllByCommodityId(UUID commodityId);

    // Flat price lookups (grade IS NULL)
    Optional<BranchPrice> findByCommodityIdAndGradeIsNullAndBranchName(UUID commodityId, String branchName);

    // Grade-based price lookups
    Optional<BranchPrice> findByCommodityIdAndGradeIdAndBranchName(UUID commodityId, UUID gradeId, String branchName);
}