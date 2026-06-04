package com.ugaap.ugaap.InventoryService.Repository;

import com.ugaap.ugaap.InventoryService.Entity.InputStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InputStockRepository extends JpaRepository<InputStock, UUID> {
    List<InputStock> findByCooperativeId(UUID cooperativeId);
    List<InputStock> findByBranchId(UUID branchId);
    List<InputStock> findByInputItemId(UUID inputItemId);
    // Find stock by short code for easier searching
    InputStock findByShortCode(String shortCode);
    // Search stock by item name (partial match) - users can find stock by name
    @Query("SELECT s FROM InputStock s WHERE LOWER(s.itemName) LIKE LOWER(CONCAT('%', :itemName, '%'))")
    List<InputStock> findByItemNameContainingIgnoreCase(@Param("itemName") String itemName);
}