package com.ugaap.ugaap.InventoryService.service;

import com.ugaap.ugaap.InventoryService.dto.InputStockDTO;
import com.ugaap.ugaap.InventoryService.dto.InputStockResponseDTO;
import java.util.List;
import java.util.UUID;

public interface InputStockService {
    InputStockResponseDTO addStock(InputStockDTO dto);
    List<InputStockResponseDTO> getStockByCooperative(UUID cooperativeId);
    List<InputStockResponseDTO> getStockByBranch(UUID branchId);
    List<InputStockResponseDTO> getStockByInputItem(UUID inputItemId);
    InputStockResponseDTO getStockById(UUID stockId);
    // Get all stock records - optional filter by cooperative or branch
    List<InputStockResponseDTO> getAllStock();
    // Search stock by item name - users can find stock by partial name match
    List<InputStockResponseDTO> searchStockByName(String itemName);
    void deleteStock(UUID stockId);
}