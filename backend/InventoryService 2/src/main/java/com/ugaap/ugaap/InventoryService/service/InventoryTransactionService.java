package com.ugaap.ugaap.InventoryService.service;

import com.ugaap.ugaap.InventoryService.dto.InventoryTransactionResponseDTO;

import java.util.List;
import java.util.UUID;

public interface InventoryTransactionService {

    InventoryTransactionResponseDTO recordTransaction(UUID inputStockId, String transactionType, Double quantity, UUID performedBy);

    List<InventoryTransactionResponseDTO> getTransactionsByStock(UUID inputStockId);
}