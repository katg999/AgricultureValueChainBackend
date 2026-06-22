package com.ugaap.ugaap.CollectionService.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Complete response payload representing a single delivery ledger entry.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerDeliveryDTO {

    private UUID id;
    private String branch;
    private String farmerName;
    private String commodity;
    private String unitOfMeasure;
    private Double volume;
    private Double estimatedValueUgx;
    private String season;
    private String status;
    
    private OffsetDateTime createdAt;

    public void setTotalValue(Double totalValue) {
        	this.estimatedValueUgx = totalValue; // Map totalValue to estimatedValueUgx for backward compatibility with UI expectations
    }

    public void setDeliveryDate(OffsetDateTime offsetDateTime) {
            	this.createdAt = offsetDateTime; // Map deliveryDate to createdAt for consistent timestamp tracking in list views
    }
}