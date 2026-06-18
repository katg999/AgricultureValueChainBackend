package com.ugaap.ugaap.CollectionService.Service;

import com.ugaap.ugaap.CollectionService.Entity.FarmerDelivery;
import com.ugaap.ugaap.CollectionService.Repository.FarmerDeliveryRepository;
import com.ugaap.ugaap.CollectionService.DTO.FarmerDeliveryCreateDTO;
import com.ugaap.ugaap.CollectionService.DTO.FarmerDeliveryDTO;
import com.ugaap.ugaap.CollectionService.DTO.FarmerDeliveryListDTO;
import com.ugaap.ugaap.CollectionService.DTO.FarmerDeliveryUpdateDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FarmerDeliveryService {

    private final FarmerDeliveryRepository farmerDeliveryRepository;
    private final RestTemplate restTemplate;

    @Value("${inventory.service.url:http://localhost:8083}")
    private String inventoryServiceUrl;

    /**
     * Commits a new delivery record mapping the agricultural produce volumes
     * alongside explicit loan indicators (UGX, quantity, fractions, statuses).
     * * NOTE: This method NO LONGER automatically triggers cross-service debt recovery. 
     * Debt is only recovered via the processBatchSettlement method after cooperative sales.
     */
    public FarmerDeliveryDTO createFarmerDelivery(FarmerDeliveryCreateDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Delivery data transfer object cannot be null");
        }

        FarmerDelivery delivery = new FarmerDelivery();

        delivery.setBranch(dto.getBranch());
        delivery.setCommodity(dto.getCommodity());
        delivery.setFarmerName(dto.getFarmerName());
        delivery.setUnitOfMeasure(dto.getUnitOfMeasure());
        delivery.setQuantityDelivered(dto.getVolume());
        delivery.setEstimatedDeliveryValue(dto.getEstimatedValueUgx());
        delivery.setSeason(dto.getSeason());

        // 2. Resolve Status Handling safely
        delivery.setStatus(dto.getStatus() != null && !dto.getStatus().isBlank()
                ? dto.getStatus()
                : "Pending");

        // Automated Operational Tracking Metadata Fallbacks
        // Safe Date processing mapping local host machine timelines fallback
        delivery.setDeliveryDate(new java.util.Date());

        // 4. Calculate total value dynamically on save
        if (delivery.getQuantityDelivered() != null && delivery.getEstimatedDeliveryValue() != null) {
            delivery.setTotalValue(delivery.getQuantityDelivered() * delivery.getEstimatedDeliveryValue());
        } else {
            delivery.setTotalValue(0.0);
        }

        // Look up or dynamically map cross-references downstream if your system relies on them
        // (e.g., if you need to resolve farmerId via a lookup on farmerRepository using dto.getFarmerName())

        FarmerDelivery savedDelivery = farmerDeliveryRepository.save(delivery);
        return mapToDTO(savedDelivery);
    }

    /**
     * Unpaginated transaction summary finder for data exports and reports.
     */
    @Transactional(readOnly = true)
    public List<FarmerDeliveryListDTO> getAllFarmerDeliveriesWithTotalValue() {
        List<FarmerDelivery> deliveries = farmerDeliveryRepository.findAll();
        return deliveries.stream()
                .map(this::mapToListDTO)
                .collect(Collectors.toList());
    }

    /**
     * Paginated transaction finder matching Spring Data Pageable.
     */
    @Transactional(readOnly = true)
    public Page<FarmerDeliveryDTO> getAllFarmerDeliveriesWithTotalValue(Specification<FarmerDelivery> spec, Pageable pageable) {
        Page<FarmerDelivery> deliveries = farmerDeliveryRepository.findAll(pageable);
        return deliveries.map(this::mapToDTO);
    }

    /**
     * Resolution lookup endpoint. In the Collection Service, text-based names are routed 
     * to the FarmerRepository by FarmerService. This method strictly handles exact name matching
     * for direct delivery queries.
     */
    @Transactional(readOnly = true)
    public List<FarmerDeliveryDTO> searchDeliveries(String farmerName) {
        if (farmerName == null || farmerName.isBlank()) {
            return List.of();
        }
        List<FarmerDelivery> deliveries = farmerDeliveryRepository.findByFarmerNameContainingIgnoreCase(farmerName.trim());
        return deliveries.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    /**
     * Processes partial JSON modifications safely based on fields present in update DTO.
     * Aligned with Controller invocation names to resolve endpoint routing mismatches.
     */
    public FarmerDeliveryDTO updateDelivery(UUID id, FarmerDeliveryUpdateDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Update payload data cannot be null");
        }

        // Fix: Changed ID parameter type from Long to UUID to match repository schema definition
        FarmerDelivery delivery = farmerDeliveryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Target transaction missing for index ID: " + id));

        if (dto.getBranch() != null) {
            delivery.setBranch(dto.getBranch());
        }
        if (dto.getCommodity() != null) {
            delivery.setCommodity(dto.getCommodity());
        }
        if (dto.getFarmerName() != null) {
            delivery.setFarmerName(dto.getFarmerName());
        }
        if (dto.getUnitOfMeasure() != null) {
            delivery.setUnitOfMeasure(dto.getUnitOfMeasure());
        }
        if (dto.getSeason() != null) {
            delivery.setSeason(dto.getSeason());
        }
        if (dto.getStatus() != null) {
            delivery.setStatus(dto.getStatus());
        }

        if (dto.getVolume() != null) {
            delivery.setQuantityDelivered(dto.getVolume());
        }
        if (dto.getEstimatedValueUgx() != null) {
            delivery.setEstimatedDeliveryValue(dto.getEstimatedValueUgx());
        }

        // Dynamic Financial Total Value Recalculation Guard
        if (delivery.getQuantityDelivered() != null && delivery.getEstimatedDeliveryValue() != null) {
            delivery.setTotalValue(delivery.getQuantityDelivered() * delivery.getEstimatedDeliveryValue());
        }

        // Persist change logs down to PostgreSQL and return the outbound DTO
        FarmerDelivery updatedDelivery = farmerDeliveryRepository.save(delivery);
        return mapToDTO(updatedDelivery);
    }

    /**
     * Removes targeted indices safely out of underlying relational schema tables.
     */
    public void deleteFarmerDelivery(UUID id) {
        if (!farmerDeliveryRepository.existsById(id)) {
            throw new RuntimeException("Target context record missing for removal actions: " + id);
        }
        farmerDeliveryRepository.deleteById(id);
    }

    /**
     * DELAYED RECOVERY HOOK: Triggered downstream from an external orchestration webhook
     * or message listener ONLY after the Payment Service confirms a batch file has been fully compiled.
     * * @param deliveryIds List of primary keys (UUIDs) matching the records included in the generated file.
     * @param authHeader The passing Bearer identity credential token to bridge contextual permissions.
     * @return count of successfully synchronized allocations across services.
     */
//    public int processBatchSettlement(List<UUID> deliveryIds, String authHeader) {
//        if (deliveryIds == null || deliveryIds.isEmpty()) {
//            return 0;
//        }
//
//        int successCount = 0;
//
//        // Optimized database pull retrieving all relevant deliveries in a single batch pass
//        List<FarmerDelivery> targetDeliveries = farmerDeliveryRepository.findAllById(deliveryIds);
//
//        for (FarmerDelivery delivery : targetDeliveries) {
//            // Only process recoveries for records matching active statuses and verified historical associations
//            if (delivery.getFarmerId() != null && "Pending".equalsIgnoreCase(delivery.getStatus())) {
//
//                // Delegate downstream ledger verification checks out to the inventory service
//                boolean synced = triggerValueRecoveryToInventory(delivery, authHeader);
//
//                if (synced) {
//                    // Update the local ledger status state to capture the final step in the settlement process
//                    delivery.setStatus("Paid");
//                    farmerDeliveryRepository.save(delivery);
//                    successCount++;
//                }
//            }
//        }
//        return successCount;
//    }
//
//    /**
//     * Reaches across the network to strictly modify the Inventory Service ledger.
//     * Includes Authorization headers to pass PERM_PROCESS_RECOVERY checks.
//     */
//    private boolean triggerValueRecoveryToInventory(FarmerDelivery delivery, String authHeader) {
//        try {
//            // Targets the versioned API endpoint on the Inventory Service
//            String endpoint = inventoryServiceUrl + "/api/v1/allocations/" + delivery.getFarmerId() + "/recover";
//
//            HttpHeaders headers = new HttpHeaders();
//            headers.setContentType(MediaType.APPLICATION_JSON);
//            if (authHeader != null && !authHeader.isBlank()) {
//                headers.set("Authorization", authHeader);
//            }
//
//            // Sends the total monetary value withheld from the farmer's produce payout
//            String jsonPayload = String.format("{\"recoveredValue\": %f}", delivery.getTotalValue());
//            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);
//
//            restTemplate.postForEntity(endpoint, entity, Void.class);
//            log.info("Batch Settlement: Successfully synced recovery transaction for allocation: {}", delivery.getFarmerId());
//            return true;
//        } catch (Exception e) {
//            log.error("Batch Settlement Failed for allocation: {}. Debt remains pending. Error: {}",
//                    delivery.getFarmerId(), e.getMessage());
//            return false;
//        }
//    }

    @Transactional
    public int processBatchSettlement(List<UUID> clearedDeliveryIds, String authHeader) {
        if (clearedDeliveryIds == null || clearedDeliveryIds.isEmpty()) {
            return 0;
        }

        // 1. Pull the actual records from the database using the IDs sent by the Payment Service
        List<FarmerDelivery> deliveries = farmerDeliveryRepository.findAllById(clearedDeliveryIds);

        List<FarmerDelivery> deliveriesWithLoans = new java.util.ArrayList<>();
        int standalonePaidCount = 0;

        // 2. Separate deliveries based on loan existence
        for (FarmerDelivery delivery : deliveries) {
            // Check if there's an active link to an input allocation loan
            if (delivery.getInputAllocationId() != null && delivery.getInputValueUgx() > 0) {
                deliveriesWithLoans.add(delivery);
            } else {
                // No loan exists! Simply transition local delivery record state to PAID
                delivery.setStatus("PAID");
                standalonePaidCount++;
            }
        }

        // 3. Save the debt-free updates locally right away
        if (standalonePaidCount > 0) {
            farmerDeliveryRepository.saveAll(deliveries);
            log.info("Marked {} debt-free delivery records as PAID locally.", standalonePaidCount);
        }

        // 4. Process the group that actually has a loan balance to settle
        int remoteRecoveriesCount = 0;
        if (!deliveriesWithLoans.isEmpty()) {
            remoteRecoveriesCount = triggerRemoteInventoryDebtRecovery(deliveriesWithLoans, authHeader);
        }

        // Return total combined successfully settled delivery records
        return standalonePaidCount + remoteRecoveriesCount;
    }

    /**
     * Encapsulates the RestTemplate call to the Inventory Service
     * strictly for records that have a valid inputAllocationId.
     */
    private int triggerRemoteInventoryDebtRecovery(List<FarmerDelivery> deliveriesWithLoans, String authHeader) {
        try {
            // Extract the unique loan IDs to send as the request body payload
            List<Object> loanAllocationIds = deliveriesWithLoans.stream()
                    .map(FarmerDelivery::getInputAllocationId)
                    .collect(Collectors.toList());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", authHeader); // Propagate token security safely

            HttpEntity<List<Object>> requestEntity = new HttpEntity<>(loanAllocationIds, headers);

            // POST to the Inventory Service's batch settlement recovery endpoint
            String url = inventoryServiceUrl + "/api/v1/allocations/batch-clear";

            ResponseEntity<Void> response = restTemplate.postForEntity(url, requestEntity, Void.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                // If the remote update succeeds, finalize our local collection statuses to PAID
                for (FarmerDelivery delivery : deliveriesWithLoans) {
                    delivery.setStatus("PAID");
                }
                farmerDeliveryRepository.saveAll(deliveriesWithLoans);
                return deliveriesWithLoans.size();
            }
        } catch (Exception e) {
            log.error("Failed to propagate debt recovery loop to Inventory Service: {}", e.getMessage());
            // Handle fallback logic or throw a custom exception to roll back the local transaction
        }
        return 0;
    }

    /**
     * Maps entity layer back to the primary delivery response structure.
     * Integrates type conversion from Date to OffsetDateTime.
     */
    private FarmerDeliveryDTO mapToDTO(FarmerDelivery delivery) {
        if (delivery == null) {
            return null;
        }

        FarmerDeliveryDTO dto = new FarmerDeliveryDTO();

        // Direct Primary Identity Metadata
        dto.setId(delivery.getId());

        // Core UI Properties
        dto.setBranch(delivery.getBranch());
        dto.setFarmerName(delivery.getFarmerName());
        dto.setCommodity(delivery.getCommodity());
        dto.setUnitOfMeasure(delivery.getUnitOfMeasure());

        // Mapping internal metrics to the simplified frontend names
        dto.setVolume(delivery.getQuantityDelivered());
        dto.setEstimatedValueUgx(delivery.getEstimatedDeliveryValue());
        dto.setSeason(delivery.getSeason());
        dto.setStatus(delivery.getStatus());

        // Keep calculated read-only values for backend reporting displays
        dto.setTotalValue(delivery.getTotalValue());

        // Modern Timezone-Aware Time Data Processing
        if (delivery.getDeliveryDate() != null) {
            dto.setDeliveryDate(java.time.OffsetDateTime.ofInstant(
                    delivery.getDeliveryDate().toInstant(), java.time.ZoneId.systemDefault()));
        }

        if (delivery.getCreatedAt() != null) {
            dto.setCreatedAt(java.time.OffsetDateTime.ofInstant(
                    delivery.getCreatedAt().toInstant(), java.time.ZoneId.systemDefault()));
        }

        return dto;
    }

    /**
     * Maps to a lightweight summary DTO structure optimized for high-volume list exports.
     */
    private FarmerDeliveryListDTO mapToListDTO(FarmerDelivery delivery) {
        if (delivery == null) {
            return null;
        }

        FarmerDeliveryListDTO dto = new FarmerDeliveryListDTO();

        // Primary Record Tracking Identifier
        dto.setId(delivery.getId());

        // Core Operational Properties
        dto.setBranch(delivery.getBranch());
        dto.setFarmerName(delivery.getFarmerName());
        dto.setCommodity(delivery.getCommodity());
        dto.setUnitOfMeasure(delivery.getUnitOfMeasure());

        // Naming alignment for metrics on the frontend interface
        dto.setVolume(delivery.getQuantityDelivered());
        dto.setEstimatedValueUgx(delivery.getEstimatedDeliveryValue());
        dto.setTotalValue(delivery.getTotalValue()); // Useful calculation for data tables
        dto.setSeason(delivery.getSeason());
        dto.setStatus(delivery.getStatus());

        // Modern Timezone-Aware Auditing Fields
        if (delivery.getDeliveryDate() != null) {
            dto.setDeliveryDate(java.time.OffsetDateTime.ofInstant(
                    delivery.getDeliveryDate().toInstant(), java.time.ZoneId.systemDefault()));
        }

        if (delivery.getCreatedAt() != null) {
            dto.setCreatedAt(java.time.OffsetDateTime.ofInstant(
                    delivery.getCreatedAt().toInstant(), java.time.ZoneId.systemDefault()));
        }

        return dto;
    }

    public Page<FarmerDelivery> getAllPaginatedWithSpec(Specification<FarmerDelivery> spec, Pageable sanitizedPageable) {
        return null;
    }

    public FarmerDeliveryDTO convertToDTO(FarmerDelivery farmerDelivery) {
        return null;
    }
}