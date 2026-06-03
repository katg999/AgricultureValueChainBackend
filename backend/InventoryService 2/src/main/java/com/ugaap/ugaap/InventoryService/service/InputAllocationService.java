package com.ugaap.ugaap.InventoryService.service;

import com.ugaap.ugaap.InventoryService.dto.InputAllocationDTO;
import com.ugaap.ugaap.InventoryService.dto.InputAllocationResponseDTO;
import java.util.List;
import java.util.UUID;

public interface InputAllocationService {
    InputAllocationResponseDTO issueInput(InputAllocationDTO dto);
    InputAllocationResponseDTO acknowledgeReceipt(UUID allocationId, UUID performedBy);
    void recordRecovery(UUID allocationId, Double quantity);
    InputAllocationResponseDTO getAllocationById(UUID allocationId);
    // Get allocations by cooperative or branch
    List<InputAllocationResponseDTO> getAllocationsByCooperative(UUID cooperativeId);
    List<InputAllocationResponseDTO> getAllocationsByBranch(UUID branchId);
    // Get allocations for a farmer - needed for auto-detection in CollectionService
    List<InputAllocationResponseDTO> getAllocationsByFarmer(UUID farmerId);
    // Search allocations by farmer identifier (UUID) or name - unified search
    List<InputAllocationResponseDTO> searchAllocations(String query);
    // Get today's issuances for dashboard
    List<InputAllocationResponseDTO> getTodaysIssuances(UUID cooperativeId);
}