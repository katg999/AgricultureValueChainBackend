package com.ugaap.configuration.service;

import com.ugaap.configuration.dto.PriceRequest;
import com.ugaap.configuration.dto.PriceResponse;
import com.ugaap.configuration.entity.BranchPrice;
import com.ugaap.configuration.entity.Grade;
import com.ugaap.configuration.repository.BranchPriceRepository;
import com.ugaap.configuration.repository.GradeRepository;
import com.ugaap.shared.Exception.AuthException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PriceService {

    private final BranchPriceRepository branchPriceRepository;
    private final GradeRepository       gradeRepository;

    // ── Set price (create or update) ─────────────────────────────────────────

    @Transactional
    public List<PriceResponse> setPrice(PriceRequest request) {
        Grade grade = gradeRepository.findById(request.getGradeId())
                .orElseThrow(() -> new AuthException("Grade not found"));

        List<PriceResponse> responses = new ArrayList<>();

        boolean isGlobal = request.getBranchIds() == null
                || request.getBranchIds().isEmpty();

        if (isGlobal) {
            // Apply to all branches (branchId = null)
            responses.add(upsertPrice(grade, null, request.getNewPrice()));
        } else {
            // Apply to each specified branch
            for (UUID branchId : request.getBranchIds()) {
                responses.add(upsertPrice(grade, branchId, request.getNewPrice()));
            }
        }

        return responses;
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    public List<PriceResponse> getAllPrices() {
        return branchPriceRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<PriceResponse> getPricesForBranch(UUID branchId) {
        return branchPriceRepository.findAllByBranchId(branchId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<PriceResponse> getGlobalPrices() {
        return branchPriceRepository.findAllByBranchIdIsNull()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private PriceResponse upsertPrice(Grade grade, UUID branchId, BigDecimal newPrice) {
        BranchPrice price;

        if (branchId == null) {
            price = branchPriceRepository
                    .findByGradeIdAndBranchIdIsNull(grade.getId())
                    .orElse(BranchPrice.builder().grade(grade).build());
        } else {
            price = branchPriceRepository
                    .findByGradeIdAndBranchId(grade.getId(), branchId)
                    .orElse(BranchPrice.builder().grade(grade).branchId(branchId).build());
        }

        // Shift current → old, set new
        price.setCurrentPrice(
                price.getNewPrice() != null ? price.getNewPrice() : BigDecimal.ZERO
        );
        price.setNewPrice(newPrice);
        price.setChangePercent(computeChange(price.getCurrentPrice(), newPrice));

        branchPriceRepository.save(price);
        log.info("Price set for grade {} branch {}: {}", grade.getCode(), branchId, newPrice);
        return toResponse(price);
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
                .gradeName(p.getGrade().getName())
                .gradeCode(p.getGrade().getCode())
                .branchId(p.getBranchId())
                .currentPrice(p.getCurrentPrice())
                .newPrice(p.getNewPrice())
                .changePercent(p.getChangePercent())
                .build();
    }
}