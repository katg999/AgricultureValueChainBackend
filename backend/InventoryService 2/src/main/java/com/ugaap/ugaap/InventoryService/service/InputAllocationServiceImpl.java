package com.ugaap.ugaap.InventoryService.service;

import com.ugaap.ugaap.InventoryService.Entity.Farmer;
import com.ugaap.ugaap.InventoryService.Entity.Branch;
import com.ugaap.ugaap.InventoryService.Entity.InputAllocation;
import com.ugaap.ugaap.InventoryService.Entity.InputStock;
import com.ugaap.ugaap.InventoryService.Repository.FarmerRepository;
import com.ugaap.ugaap.InventoryService.Repository.BranchRepository;
import com.ugaap.ugaap.InventoryService.Repository.InputAllocationRepository;
import com.ugaap.ugaap.InventoryService.Repository.InputStockRepository;
import com.ugaap.ugaap.InventoryService.audit.AuditLog;
import com.ugaap.ugaap.InventoryService.Repository.AuditLogRepository;
import com.ugaap.ugaap.InventoryService.dto.InputAllocationDTO;
import com.ugaap.ugaap.InventoryService.dto.InputAllocationResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class InputAllocationServiceImpl implements InputAllocationService {

    private final InputAllocationRepository allocationRepository;
    private final InputStockRepository inputStockRepository;
    private final FarmerRepository farmerRepository;
    private final BranchRepository branchRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    public InputAllocationResponseDTO issueInput(InputAllocationDTO dto) {
        // Resolve inputStock - can use inputStockId or itemName
        UUID inputStockId = dto.getInputStockId();
        InputStock stock = null;
        if (inputStockId == null && dto.getItemName() != null) {
            // Search by item name if inputStockId not provided
            stock = inputStockRepository.findByItemNameContainingIgnoreCase(dto.getItemName()).stream().findFirst().orElse(null);
            if (stock != null) {
                inputStockId = stock.getId();
            }
        } else if (inputStockId != null) {
            stock = inputStockRepository.findById(inputStockId).orElse(null);
        }
        
        if (stock == null) {
            throw new IllegalArgumentException("Input stock not found with provided identifier");
        }
        
        if (stock.getAvailableQuantity() < dto.getQuantity()) {
            throw new IllegalArgumentException("Insufficient stock. Available: " + stock.getAvailableQuantity() + ", requested: " + dto.getQuantity());
        }
        
        // Auto-calculate total value if not provided (quantity * unitCost from stock)
        Double totalValue = dto.getTotalValue();
        if (totalValue == null) {
            totalValue = dto.getQuantity() * stock.getUnitCost();
        }
        
        // Resolve farmer - can use farmerId or farmerName
        UUID farmerId = dto.getFarmerId();
        Farmer farmer = null;
        if (farmerId == null && dto.getFarmerName() != null) {
            // Search by farmer name if farmerId not provided
            farmer = farmerRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(dto.getFarmerName()).stream().findFirst().orElse(null);
            if (farmer != null) {
                farmerId = farmer.getId();
            }
        } else if (farmerId != null) {
            farmer = farmerRepository.findById(farmerId).orElse(null);
        }
        
        // Resolve branch - can use branchId or branchName
        UUID branchId = dto.getBranchId();
        Branch branch = null;
        if (branchId == null && dto.getBranchName() != null) {
            // Search by branch name if branchId not provided
            List<Branch> branches = branchRepository.findByNameContainingIgnoreCase(dto.getBranchName());
            if (!branches.isEmpty()) {
                branch = branches.get(0);
                branchId = branch.getId();
            }
        } else if (branchId != null) {
            branch = branchRepository.findById(branchId).orElse(null);
        }
        
        if (farmerId == null) {
            throw new IllegalArgumentException("Farmer not found with provided identifier");
        }
        if (branchId == null) {
            throw new IllegalArgumentException("Branch not found with provided identifier");
        }

        // Create allocation - itemName is derived from InputStock for data consistency
        InputAllocation allocation = InputAllocation.builder()
                .farmerId(farmerId).branchId(branchId).cooperativeId(dto.getCooperativeId())
                .inputStockId(inputStockId)
                .itemName(stock.getItemName())
                .quantity(dto.getQuantity()).totalValue(totalValue)
                .issueDate(java.time.LocalDateTime.now()).season(dto.getSeason())
                .replacementTerms(dto.getReplacementTerms())
                .farmerAcknowledged(false).fullyRecovered(false).recoveredQuantity(0.0)
                .build();
        InputAllocation saved = allocationRepository.save(allocation);

        // Reduce all stock values proportionally when issuing
        Double issuedQty = dto.getQuantity();
        Double originalTotalQty = stock.getQuantity();
        Double originalAvailable = stock.getAvailableQuantity();
        Double originalTotalValue = stock.getTotalValue();
        
        // New available after issuance
        Double newAvailable = originalAvailable - issuedQty;
        
        // Proportional reduction of quantity and total_value
        if (originalAvailable != null && originalAvailable > 0) {
            double ratio = newAvailable / originalAvailable;
            stock.setQuantity(originalTotalQty * ratio);
            stock.setAvailableQuantity(newAvailable);
            if (originalTotalValue != null) {
                stock.setTotalValue(originalTotalValue * ratio);
            }
        } else {
            stock.setAvailableQuantity(0.0);
        }
        inputStockRepository.save(stock);

        auditLogRepository.save(AuditLog.builder()
                .entityType("InputAllocation").entityId(saved.getId()).action("ISSUE")
                .performedBy(dto.getCooperativeId())
                .changes("{\"quantity\":" + dto.getQuantity() + ",\"stockId\":\"" + dto.getInputStockId() + "\"}")
                .build());
        return mapToResponseDTO(saved, farmer, branch);
    }

    @Override
    public InputAllocationResponseDTO acknowledgeReceipt(UUID allocationId, UUID performedBy) {
        InputAllocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new IllegalArgumentException("Allocation not found with id: " + allocationId));
        allocation.setFarmerAcknowledged(true);
        allocation.setAcknowledgedDate(java.time.LocalDateTime.now());
        InputAllocation saved = allocationRepository.save(allocation);
        Farmer farmer = farmerRepository.findById(saved.getFarmerId()).orElse(null);
        Branch branch = branchRepository.findById(saved.getBranchId()).orElse(null);
        auditLogRepository.save(AuditLog.builder()
                .entityType("InputAllocation").entityId(allocationId).action("ACKNOWLEDGE")
                .performedBy(performedBy).changes("{\"acknowledged\":true}").build());
        return mapToResponseDTO(saved, farmer, branch);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InputAllocationResponseDTO> getAllocationsByCooperative(UUID cooperativeId) {
        return allocationRepository.findByCooperativeId(cooperativeId).stream()
                .map(a -> {
                    Farmer f = farmerRepository.findById(a.getFarmerId()).orElse(null);
                    Branch b = branchRepository.findById(a.getBranchId()).orElse(null);
                    return mapToResponseDTO(a, f, b);
                })
                .toList();
    }

    @Override
    public List<InputAllocationResponseDTO> getAllocationsByBranch(UUID branchId) {
        return allocationRepository.findByBranchId(branchId).stream()
                .map(a -> {
                    Farmer f = farmerRepository.findById(a.getFarmerId()).orElse(null);
                    Branch b = branchRepository.findById(a.getBranchId()).orElse(null);
                    return mapToResponseDTO(a, f, b);
                })
                .toList();
    }

    // Get allocations for a farmer - needed for auto-detection in CollectionService
    @Override
    @Transactional(readOnly = true)
    public List<InputAllocationResponseDTO> getAllocationsByFarmer(UUID farmerId) {
        return allocationRepository.findByFarmerId(farmerId).stream()
                .map(a -> {
                    Farmer f = farmerRepository.findById(a.getFarmerId()).orElse(null);
                    Branch b = branchRepository.findById(a.getBranchId()).orElse(null);
                    return mapToResponseDTO(a, f, b);
                })
                .toList();
    }

    @Override
    public InputAllocationResponseDTO getAllocationById(UUID allocationId) {
        InputAllocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new IllegalArgumentException("Allocation not found with id: " + allocationId));
        Farmer farmer = farmerRepository.findById(allocation.getFarmerId()).orElse(null);
        Branch branch = branchRepository.findById(allocation.getBranchId()).orElse(null);
        return mapToResponseDTO(allocation, farmer, branch);
    }

    @Override
    public List<InputAllocationResponseDTO> getTodaysIssuances(UUID cooperativeId) {
        java.time.LocalDateTime startOfDay = java.time.LocalDateTime.now().toLocalDate().atStartOfDay();
        return allocationRepository.findByCooperativeId(cooperativeId).stream()
                .filter(a -> a.getIssueDate() != null && a.getIssueDate().isAfter(startOfDay))
                .map(a -> {
                    Farmer f = farmerRepository.findById(a.getFarmerId()).orElse(null);
                    Branch b = branchRepository.findById(a.getBranchId()).orElse(null);
                    return mapToResponseDTO(a, f, b);
                })
                .toList();
    }

    // Unified search - finds allocations by farmer UUID or name
    @Override
    @Transactional(readOnly = true)
    public List<InputAllocationResponseDTO> searchAllocations(String query) {
        // Try to parse as UUID first
        try {
            UUID farmerId = UUID.fromString(query);
            return allocationRepository.findByFarmerId(farmerId).stream()
                    .map(a -> {
                        Farmer f = farmerRepository.findById(a.getFarmerId()).orElse(null);
                        Branch b = branchRepository.findById(a.getBranchId()).orElse(null);
                        return mapToResponseDTO(a, f, b);
                    })
                    .toList();
        } catch (IllegalArgumentException e) {
            // Not a UUID, search by farmer name
        }
        // Search by farmer name - get all allocations and filter
        return allocationRepository.findAll().stream()
                .filter(allocation -> {
                    Farmer f = farmerRepository.findById(allocation.getFarmerId()).orElse(null);
                    if (f != null && f.getName() != null) {
                        return f.getName().toLowerCase().contains(query.toLowerCase());
                    }
                    return false;
                })
                .map(a -> {
                    Farmer f = farmerRepository.findById(a.getFarmerId()).orElse(null);
                    Branch b = branchRepository.findById(a.getBranchId()).orElse(null);
                    return mapToResponseDTO(a, f, b);
                })
                .toList();
    }

    @Override
    @Transactional
    public void recordRecovery(UUID allocationId, Double quantity) {
        InputAllocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new IllegalArgumentException("Allocation not found with id: " + allocationId));
        double newQty = allocation.getRecoveredQuantity() + quantity;
        if (newQty > allocation.getQuantity())
            throw new IllegalArgumentException("Recovery quantity cannot exceed issued quantity.");
        allocation.setRecoveredQuantity(newQty);
        allocation.setFullyRecovered(java.math.BigDecimal.valueOf(newQty).compareTo(java.math.BigDecimal.valueOf(allocation.getQuantity())) == 0);
        allocationRepository.save(allocation);
        
        // Auto-update stock record when recovered quantity changes
        // This tracks how much input has been returned to inventory
        autoUpdateStockForRecovery(allocation.getInputStockId(), quantity);
    }

    // When inputs are recovered, we need to track them
    // Currently we just log the recovery; future enhancement could add to available stock
    private void autoUpdateStockForRecovery(UUID stockId, Double recoveredQuantity) {
        try {
            // Get current stock to see updated available quantity impact
            InputStock stock = inputStockRepository.findById(stockId).orElse(null);
            if (stock != null) {
                System.out.println("Recovery of " + recoveredQuantity + " recorded for stock " + stockId +
                        " (current available: " + stock.getAvailableQuantity() + ")");
            }
        } catch (Exception e) {
            System.err.println("Could not update stock for recovery: " + e.getMessage());
        }
    }

    private InputAllocationResponseDTO mapToResponseDTO(InputAllocation a, Farmer farmer, Branch branch) {
        return InputAllocationResponseDTO.builder()
                .id(a.getId()).farmerId(a.getFarmerId())
                .farmerName(farmer != null ? farmer.getFirstName() + " " + farmer.getLastName() : "Unassigned")
                .branchId(a.getBranchId())
                .branchName(branch != null ? branch.getName() : "Unassigned")
                .cooperativeId(a.getCooperativeId()).inputStockId(a.getInputStockId())
                .itemName(a.getItemName())
                .quantity(a.getQuantity()).totalValue(a.getTotalValue())
                .issueDate(a.getIssueDate()).season(a.getSeason()).replacementTerms(a.getReplacementTerms())
                .farmerAcknowledged(a.getFarmerAcknowledged()).acknowledgedDate(a.getAcknowledgedDate())
                .fullyRecovered(a.getFullyRecovered()).recoveredQuantity(a.getRecoveredQuantity())
                .createdAt(a.getCreatedAt())
                .build();
    }
}