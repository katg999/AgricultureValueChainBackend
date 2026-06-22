package com.ugaap.ugaap.CollectionService.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Contract for partial delivery modifications.
 * All fields are entirely optional to support sparse PATCH requests.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerDeliveryUpdateDTO {

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
}