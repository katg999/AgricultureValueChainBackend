package com.ugaap.ugaap.InventoryService.Repository;

import com.ugaap.ugaap.InventoryService.Entity.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FarmerRepository extends JpaRepository<Farmer, UUID> {
    // Search farmers by first or last name - easier than using farmer UUID
    @Query("SELECT f FROM Farmer f WHERE LOWER(f.firstName) LIKE LOWER(CONCAT('%', :name, '%')) OR LOWER(f.lastName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Farmer> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(@Param("name") String searchTerm);
}