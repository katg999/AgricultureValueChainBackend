package com.ugaap.configuration.service;

import com.ugaap.configuration.dto.FlatPriceRequest;
import com.ugaap.configuration.dto.GradePriceRequest;
import com.ugaap.configuration.dto.PriceResponse;
import com.ugaap.configuration.entity.BranchPrice;
import com.ugaap.configuration.entity.Commodity;
import com.ugaap.configuration.entity.Grade;
import com.ugaap.configuration.repository.BranchPriceRepository;
import com.ugaap.configuration.repository.CommodityRepository;
import com.ugaap.configuration.repository.GradeRepository;
import com.ugaap.shared.Exception.AuthException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PriceService {

    private final BranchPriceRepository branchPriceRepository;
    private final GradeRepository       gradeRepository;
    private final CommodityRepository   commodityRepository;

    // ── Flat price (no grade) ───────────────────────────────────────────────

    @Transactional
    public PriceResponse setFlatPrice(FlatPriceRequest request) {
        Commodity commodity = commodityRepository.findById(request.getCommodityId())
                .orElseThrow(() -> new AuthException("Commodity not found"));

        BranchPrice price = branchPriceRepository
                .findByCommodityIdAndGradeIsNullAndBranchName(commodity.getId(), request.getBranchName())
                .orElse(BranchPrice.builder().commodity(commodity).branchName(request.getBranchName()).build());

        applyNewPrice(price, request.getPricePerKg());
        branchPriceRepository.save(price);

        log.info("Flat price set for commodity {} branch {}: {}",
                commodity.getCode(), request.getBranchName(), request.getPricePerKg());

        return toResponse(price);
    }

    // ── Grade-based price ────────────────────────────────────────────────────

    @Transactional
    public PriceResponse setGradePrice(GradePriceRequest request) {
        Commodity commodity = commodityRepository.findById(request.getCommodityId())
                .orElseThrow(() -> new AuthException("Commodity not found"));
        Grade grade = gradeRepository.findById(request.getGradeId())
                .orElseThrow(() -> new AuthException("Grade not found"));

        BranchPrice price = branchPriceRepository
                .findByCommodityIdAndGradeIdAndBranchName(commodity.getId(), grade.getId(), request.getBranchName())
                .orElse(BranchPrice.builder().commodity(commodity).grade(grade)
                        .branchName(request.getBranchName()).build());

        applyNewPrice(price, request.getPricePerKg());
        branchPriceRepository.save(price);

        log.info("Grade price set for commodity {} grade {} branch {}: {}",
                commodity.getCode(), grade.getCode(), request.getBranchName(), request.getPricePerKg());

        return toResponse(price);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    public List<PriceResponse> getAllPrices() {
        return branchPriceRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<PriceResponse> getPricesForBranch(String branchName) {
        return branchPriceRepository.findAllByBranchName(branchName)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<PriceResponse> getPricesForCommodity(UUID commodityId) {
        return branchPriceRepository.findAllByCommodityId(commodityId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void applyNewPrice(BranchPrice price, BigDecimal newPrice) {
        price.setCurrentPrice(
                price.getNewPrice() != null ? price.getNewPrice() : BigDecimal.ZERO
        );
        price.setNewPrice(newPrice);
        price.setChangePercent(computeChange(price.getCurrentPrice(), newPrice));
    }

    private BigDecimal computeChange(BigDecimal current, BigDecimal newPrice) {
        if (current == null || current.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return newPrice.subtract(current)
                .divide(current, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private PriceResponse toResponse(BranchPrice p) {
        return PriceResponse.builder()
                .id(p.getId())
                .commodityName(p.getCommodity().getName())
                .commodityCode(p.getCommodity().getCode())
                .gradeName(p.getGrade() != null ? p.getGrade().getName() : null)
                .gradeCode(p.getGrade() != null ? p.getGrade().getCode() : null)
                .branchName(p.getBranchName())
                .currentPrice(p.getCurrentPrice())
                .newPrice(p.getNewPrice())
                .changePercent(p.getChangePercent())
                .build();
    }
}