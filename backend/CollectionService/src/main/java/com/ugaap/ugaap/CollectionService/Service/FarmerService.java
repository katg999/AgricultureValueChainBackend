package com.ugaap.ugaap.CollectionService.Service;

import com.ugaap.ugaap.CollectionService.DTO.FarmerSearchResultDTO;
import com.ugaap.ugaap.CollectionService.Entity.Farmer;
import com.ugaap.ugaap.CollectionService.Entity.FarmerDelivery;
import com.ugaap.ugaap.CollectionService.Repository.FarmerRepository;
import com.ugaap.ugaap.CollectionService.Repository.FarmerDeliveryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FarmerService {

    private final FarmerRepository farmerRepository;
    private final FarmerDeliveryRepository farmerDeliveryRepository;

    /**
     * Unified search endpoint supporting lookups by partial name exclusively.
     * Optimized to avoid the N+1 database querying bottleneck.
     */
    public List<FarmerSearchResultDTO> searchFarmers(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        String trimmedQuery = query.trim();

        // Fetch matching farmers (1st Database Query)
        List<Farmer> farmers = farmerRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(trimmedQuery);
        if (farmers.isEmpty()) {
            return List.of();
        }

        // Extract IDs and pull ALL related deliveries at once in a single batch query (2nd Database Query)
        List<UUID> farmerIds = farmers.stream().map(Farmer::getId).collect(Collectors.toList());
        List<FarmerDelivery> allDeliveries = farmerDeliveryRepository.findByFarmerIdIn(farmerIds);

        // Group deliveries by farmerId in-memory for lightning-fast $O(1)$ lookups
        Map<UUID, List<FarmerDelivery>> deliveriesByFarmer = allDeliveries.stream()
                .collect(Collectors.groupingBy(FarmerDelivery::getFarmerId));

        // 4. Map entities using the pre-fetched in-memory map datasets
        return farmers.stream()
                .map(farmer -> mapToSearchResultDTO(farmer, deliveriesByFarmer.get(farmer.getId())))
                .collect(Collectors.toList());
    }

    /**
     * Maps an entity domain reference using pre-fetched in-memory delivery data.
     */
    private FarmerSearchResultDTO mapToSearchResultDTO(Farmer farmer, List<FarmerDelivery> deliveries) {
        if (farmer == null) {
            return null;
        }

        FarmerSearchResultDTO result = new FarmerSearchResultDTO();
        result.setFarmerId(farmer.getId());
        result.setName(farmer.getName());

        // Handle structural edge case where a matched farmer has no historical deliveries recorded yet
        if (deliveries == null || deliveries.isEmpty()) {
            result.setCommodity("N/A");
            result.setStatus(String.valueOf(0.0));
            result.setRepaymentRule("N/A");
            // Fix: set actual default status if your DTO requires it, rather than a stringified numeric 0.0
            result.setStatus("New");
            return result;
        }

        // Calculate metrics using safe local memory streams
        result.setCommodity(deliveries.getFirst().getCommodity());
        result.setRepaymentRule(deliveries.getFirst().getFarmerName());

        Double totalValue = deliveries.stream()
                .mapToDouble(d -> d.getTotalValue() != null ? d.getTotalValue() : 0.0)
                .sum();
        result.setStatus(String.valueOf(totalValue));

        // CORRECTION: Assign a proper tracking fallback state string rather than binding totalValue here
        result.setStatus(deliveries.getFirst().getStatus() != null ? deliveries.getFirst().getStatus() : "Pending");

        return result;
    }
}