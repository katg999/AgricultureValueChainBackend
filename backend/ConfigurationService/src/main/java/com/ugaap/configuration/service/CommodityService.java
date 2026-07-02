package com.ugaap.configuration.service;

import com.ugaap.configuration.dto.CommodityRequest;
import com.ugaap.configuration.dto.CommodityResponse;
import com.ugaap.configuration.entity.Commodity;
import com.ugaap.configuration.repository.CommodityRepository;
import com.ugaap.shared.Exception.AuthException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommodityService {

    private final CommodityRepository commodityRepository;

    @Transactional
    public CommodityResponse createCommodity(CommodityRequest request) {
        if (commodityRepository.existsByCode(request.getCode().toUpperCase())) {
            throw new AuthException("Commodity code already exists: " + request.getCode());
        }

        Commodity commodity = Commodity.builder()
                .name(request.getName())
                .code(request.getCode().toUpperCase())
                .description(request.getDescription())
                .build();

        commodityRepository.save(commodity);
        log.info("Commodity created: {} - {}", commodity.getCode(), commodity.getName());
        return toResponse(commodity);
    }

    public List<CommodityResponse> getAllCommodities() {
        return commodityRepository.findAllByActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public CommodityResponse getCommodityById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public void deactivateCommodity(UUID id) {
        Commodity commodity = findOrThrow(id);
        commodity.setActive(false);
        commodityRepository.save(commodity);
    }

    private Commodity findOrThrow(UUID id) {
        return commodityRepository.findById(id)
                .orElseThrow(() -> new AuthException("Commodity not found: " + id));
    }

    private CommodityResponse toResponse(Commodity c) {
        return CommodityResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .code(c.getCode())
                .description(c.getDescription())
                .active(c.isActive())
                .build();
    }
}