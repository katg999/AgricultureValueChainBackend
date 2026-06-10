package com.ugaap.ugaap.InventoryService.Repository;

import com.ugaap.ugaap.InventoryService.Entity.InputAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InputAllocationRepository extends JpaRepository<InputAllocation, UUID> {
    List<InputAllocation> findByCooperativeId(UUID cooperativeId);
    List<InputAllocation> findByFarmerId(UUID farmerId);
    // Find by inputStockId instead of inputItemId (item name derived from InputStock)
    List<InputAllocation> findByInputStockId(UUID inputStockId);
    List<InputAllocation> findByBranchId(UUID branchId);
}