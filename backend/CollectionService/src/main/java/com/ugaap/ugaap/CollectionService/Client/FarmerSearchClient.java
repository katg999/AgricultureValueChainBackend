package com.ugaap.ugaap.CollectionService.Client;

import com.ugaap.ugaap.CollectionService.DTO.FarmerSearchResultDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "MEMBERSHIP-SERVICE")
public interface FarmerSearchClient {

    @GetMapping("/api/v1/members/search")
    List<FarmerSearchResultDTO> searchFarmers(@RequestParam String query);
}