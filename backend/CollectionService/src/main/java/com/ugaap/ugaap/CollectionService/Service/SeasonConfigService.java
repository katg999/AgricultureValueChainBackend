package com.ugaap.ugaap.CollectionService.Service;

import com.ugaap.ugaap.CollectionService.DTO.SeasonConfigDTO;
import com.ugaap.ugaap.CollectionService.Entity.SeasonConfig;
import com.ugaap.ugaap.CollectionService.Repository.SeasonConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SeasonConfigService {

    private final SeasonConfigRepository seasonConfigRepository;

    public List<SeasonConfigDTO> getSeasonConfigsByCooperative(String cooperativeId) {
        List<SeasonConfig> seasons = seasonConfigRepository.findByCooperativeId(cooperativeId);

        // Convert the database Entities into DTOs safely to send back to Angular
        return seasons.stream().map(season -> {
            SeasonConfigDTO dto = new SeasonConfigDTO();
            dto.setId(season.getId());
            dto.setSeasonName(season.getSeasonName());
            dto.setStartDate(season.getStartDate());
            dto.setEndDate(season.getEndDate());
            dto.setStatus(season.getStatus());
            return dto;
        }).collect(Collectors.toList());
    }
}