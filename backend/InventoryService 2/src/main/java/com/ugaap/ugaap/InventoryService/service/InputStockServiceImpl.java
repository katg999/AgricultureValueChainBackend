package com.ugaap.ugaap.InventoryService.service;

import com.ugaap.ugaap.InventoryService.Entity.InputStock;
import com.ugaap.ugaap.InventoryService.Repository.InputStockRepository;
import com.ugaap.ugaap.InventoryService.dto.InputStockDTO;
import com.ugaap.ugaap.InventoryService.dto.InputStockResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class InputStockServiceImpl implements InputStockService {

    private final InputStockRepository inputStockRepository;

    // Add new stock to inventory - creates the input stock record
    // Short code and total value are auto-generated
    @Override
    public InputStockResponseDTO addStock(InputStockDTO dto) {
        // Auto-calculate total value from quantity * unitCost
        Double totalValue = dto.getQuantity() * dto.getUnitCost();
                 
        InputStock entity = InputStock.builder()
                .inputItemId(dto.getInputItemId())
                .itemName(dto.getItemName())
                .shortCode(dto.getShortCode())
                .cooperativeId(dto.getCooperativeId())
                .branchId(dto.getBranchId())
                .supplierName(dto.getSupplierName())
                .quantity(dto.getQuantity())
                .unitCost(dto.getUnitCost())
                .totalValue(totalValue)
                .minimumThreshold(dto.getMinimumThreshold() != null ? dto.getMinimumThreshold() : 0.0)
                .availableQuantity(dto.getQuantity())
                .build();
        InputStock saved = inputStockRepository.save(entity);
        return toResponseDTO(saved);
    }

    @Override
    public List<InputStockResponseDTO> getStockByCooperative(UUID cooperativeId) {
        return inputStockRepository.findByCooperativeId(cooperativeId).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<InputStockResponseDTO> getStockByBranch(UUID branchId) {
        return inputStockRepository.findByBranchId(branchId).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<InputStockResponseDTO> getStockByInputItem(UUID inputItemId) {
        return inputStockRepository.findByInputItemId(inputItemId).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public InputStockResponseDTO getStockById(UUID stockId) {
        InputStock entity = inputStockRepository.findById(stockId)
                .orElseThrow(() -> new IllegalArgumentException("Stock record not found with id: " + stockId));
        return toResponseDTO(entity);
    }

    // Get all stock records - optional filter handled in controller
    @Override
    public List<InputStockResponseDTO> getAllStock() {
        return inputStockRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    // Search stock by item name - users can type partial names to find stock
    @Override
    public List<InputStockResponseDTO> searchStockByName(String itemName) {
        return inputStockRepository.findByItemNameContainingIgnoreCase(itemName).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteStock(UUID stockId) {
        InputStock entity = inputStockRepository.findById(stockId)
                .orElseThrow(() -> new IllegalArgumentException("Stock record not found with id: " + stockId));
        if (entity.getAvailableQuantity() > 0) {
            throw new IllegalArgumentException("Cannot delete stock record with non-zero available quantity.");
        }
        inputStockRepository.delete(entity);
    }

    private InputStockResponseDTO toResponseDTO(InputStock e) {
        return InputStockResponseDTO.builder()
                .shortCode(e.getShortCode())
                .id(e.getId())
                .inputItemId(e.getInputItemId())
                .itemName(e.getItemName())
                .cooperativeId(e.getCooperativeId())
                .branchId(e.getBranchId())
                .supplierName(e.getSupplierName())
                .quantity(e.getQuantity())
                .unitCost(e.getUnitCost())
                .totalValue(e.getTotalValue())
                .minimumThreshold(e.getMinimumThreshold())
                .availableQuantity(e.getAvailableQuantity())
                .receivedDate(e.getReceivedDate())
                .createdAt(e.getCreatedAt())
                .build();
    }
}