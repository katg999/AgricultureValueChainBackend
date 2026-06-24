package com.ugaap.ugaap.CollectionService.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Encapsulates the UI-friendly search results for local farmer lookups.
 * Hides UUIDs from the user while delivering them to the frontend state for execution.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerSearchResultDTO {

    private String memberId;
    private String fullName;

}