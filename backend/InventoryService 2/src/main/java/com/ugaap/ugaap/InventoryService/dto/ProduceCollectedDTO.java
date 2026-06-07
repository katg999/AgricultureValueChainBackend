package com.ugaap.ugaap.InventoryService.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProduceCollectedDTO {
    private String date;
    private Double quantity;
}