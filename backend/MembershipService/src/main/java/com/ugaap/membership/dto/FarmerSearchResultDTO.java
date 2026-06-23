package com.ugaap.membership.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FarmerSearchResultDTO {
    private String memberId;
    private String fullName;
}