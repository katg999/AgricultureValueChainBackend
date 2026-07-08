package com.ugaap.ugaap.InventoryService.Repository;

import com.ugaap.ugaap.InventoryService.Entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, UUID>, JpaSpecificationExecutor<InventoryItem> {

    Optional<InventoryItem> findBySkuAndBranchId(String sku, UUID branchId);

    List<InventoryItem> findByBranchIdAndCategoryIgnoreCase(UUID branchId, String category);

    List<InventoryItem> findByBranchIdAndItemNameContainingIgnoreCase(UUID branchId, String itemName);

    List<InventoryItem> findByBranchId(UUID branchId);
}
