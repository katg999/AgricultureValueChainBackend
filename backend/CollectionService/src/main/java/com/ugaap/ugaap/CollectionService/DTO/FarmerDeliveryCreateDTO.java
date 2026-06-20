package com.ugaap.ugaap.CollectionService.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Contract for logging a new farmer delivery.
 * Includes physical produce metrics alongside credit tracking allocations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerDeliveryCreateDTO {

    @NotBlank(message = "Branch (e.g., BR-MBL) is required")
    private String branch;

    @NotBlank(message = "Commodity type (e.g., Maize) is required")
    private String commodity;

    @NotBlank(message = "Farmer name must be captured at the time of delivery")
    private String farmerName;

    @NotNull(message = "Volume cannot be null")
    @PositiveOrZero(message = "Volume must be zero or positive")
    private Double volume;

    @NotBlank(message = "Unit of measure (e.g., KG) is required")
    private String unitOfMeasure;

    @NotNull(message = "Estimated Value (UGX) cannot be null")
    @PositiveOrZero(message = "Estimated value must be zero or positive")
    private Double estimatedValueUgx;

    @NotBlank(message = "Status (e.g., Pending) is required")
    private String status;

    @NotBlank(message = "Agricultural season identifier is required")
    private String season;
    private Object farmerId;

}