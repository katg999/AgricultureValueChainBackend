package com.ugaap.ugaap.InventoryService.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransactionResponseDTO {

    private UUID id;
    private UUID inputStockId;
    private String transactionType;
    private Double previousBalance;
    private Double newBalance;
    private Double quantity;
    private UUID performedBy;
    private LocalDateTime createdAt;
}