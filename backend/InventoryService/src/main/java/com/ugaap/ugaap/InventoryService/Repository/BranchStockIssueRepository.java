package com.ugaap.ugaap.InventoryService.Repository;

import com.ugaap.ugaap.InventoryService.Entity.BranchStockIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BranchStockIssueRepository extends JpaRepository<BranchStockIssue, UUID> {

    List<BranchStockIssue> findByTargetBranchIdOrderByCreatedAtDesc(UUID targetBranchId);

    List<BranchStockIssue> findByCooperativeIdOrderByCreatedAtDesc(UUID cooperativeId);

    List<BranchStockIssue> findAllByOrderByCreatedAtDesc();
}
