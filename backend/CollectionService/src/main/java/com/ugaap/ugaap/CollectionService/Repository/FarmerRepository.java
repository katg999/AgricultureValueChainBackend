package com.ugaap.ugaap.CollectionService.Repository;

import com.ugaap.ugaap.CollectionService.Entity.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Data access layer managing cached farmer profile identifiers.
 */
@Repository
public interface FarmerRepository extends JpaRepository<Farmer, UUID> {

    /**
     * Executes case-insensitive loose partial text matches against name components.
     * Implements text-only querying to safeguard internal system IDs from direct user exposure.
     */
    @Query("SELECT f FROM Farmer f WHERE LOWER(f.firstName) LIKE LOWER(CONCAT('%', :name, '%')) OR LOWER(f.lastName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Farmer> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(@Param("name") String searchTerm);
}