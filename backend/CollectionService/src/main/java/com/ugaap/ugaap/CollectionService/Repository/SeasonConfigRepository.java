package com.ugaap.ugaap.CollectionService.Repository;

import com.ugaap.ugaap.CollectionService.Entity.SeasonConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SeasonConfigRepository extends JpaRepository<SeasonConfig, Long> {
    
    // Finds all seasons configured by a specific Cooperative Admin
    List<SeasonConfig> findByCooperativeId(String cooperativeId);
    
    // Finds the currently running season for validation when a branch worker records data
    List<SeasonConfig> findByCooperativeIdAndStatus(String cooperativeId, String status);
}