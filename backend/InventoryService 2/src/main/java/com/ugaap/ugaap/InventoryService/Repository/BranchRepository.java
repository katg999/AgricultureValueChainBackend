package com.ugaap.ugaap.InventoryService.Repository;

import com.ugaap.ugaap.InventoryService.Entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BranchRepository extends JpaRepository<Branch, UUID> {
    // Search branches by name - easier than using branch UUID
    @Query("SELECT b FROM Branch b WHERE LOWER(b.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Branch> findByNameContainingIgnoreCase(@Param("name") String name);
}