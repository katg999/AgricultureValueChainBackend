package com.ugaap.ugaap.InventoryService.service;

import com.ugaap.ugaap.InventoryService.Entity.InputStock;
import com.ugaap.ugaap.InventoryService.Entity.InventoryTransaction;
import com.ugaap.ugaap.InventoryService.Repository.InputStockRepository;
import com.ugaap.ugaap.InventoryService.Repository.InventoryTransactionRepository;
import com.ugaap.ugaap.InventoryService.dto.InventoryTransactionResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class InventoryTransactionServiceImpl implements InventoryTransactionService {

    private final InputStockRepository inputStockRepository;
    private final InventoryTransactionRepository transactionRepository;

    @Override
    public InventoryTransactionResponseDTO recordTransaction(UUID inputStockId, String transactionType, Double quantity, UUID performedBy) {
        InputStock stock = inputStockRepository.findById(inputStockId)
                .orElseThrow(() -> new RuntimeException("Input stock not found"));

        Double previousBalance = stock.getAvailableQuantity();
        Double newBalance = "STOCK_IN".equals(transactionType)
                ? previousBalance + quantity
                : previousBalance - quantity;

        if (newBalance < 0) {
            throw new IllegalArgumentException("Insufficient stock for transaction");
        }

        stock.setAvailableQuantity(newBalance);
        inputStockRepository.save(stock);

        InventoryTransaction transaction = InventoryTransaction.builder()
                .inputStockId(inputStockId)
                .transactionType(transactionType)
                .previousBalance(previousBalance)
                .newBalance(newBalance)
                .quantity(quantity)
                .performedBy(performedBy)
                .build();

        return mapToResponseDTO(transactionRepository.save(transaction));
    }

    @Override
    public List<InventoryTransactionResponseDTO> getTransactionsByStock(UUID inputStockId) {
        return transactionRepository.findByInputStockId(inputStockId).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    private InventoryTransactionResponseDTO mapToResponseDTO(InventoryTransaction entity) {
        return InventoryTransactionResponseDTO.builder()
                .id(entity.getId())
                .inputStockId(entity.getInputStockId())
                .transactionType(entity.getTransactionType())
                .previousBalance(entity.getPreviousBalance())
                .newBalance(entity.getNewBalance())
                .quantity(entity.getQuantity())
                .performedBy(entity.getPerformedBy())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}