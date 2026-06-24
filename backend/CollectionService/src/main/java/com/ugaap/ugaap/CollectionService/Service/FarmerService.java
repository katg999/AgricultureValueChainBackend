package com.ugaap.ugaap.CollectionService.Service;

import com.ugaap.ugaap.CollectionService.Client.FarmerSearchClient;
import com.ugaap.ugaap.CollectionService.DTO.FarmerSearchResultDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FarmerService {

    private final FarmerSearchClient farmerSearchClient;

    public List<FarmerSearchResultDTO> searchFarmers(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return farmerSearchClient.searchFarmers(query.trim());
    }
}