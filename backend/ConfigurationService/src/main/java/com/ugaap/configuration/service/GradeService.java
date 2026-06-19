package com.ugaap.configuration.service;

import com.ugaap.configuration.dto.GradeRequest;
import com.ugaap.configuration.dto.GradeResponse;
import com.ugaap.configuration.entity.Grade;
import com.ugaap.configuration.repository.GradeRepository;
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
public class GradeService {

    private final GradeRepository gradeRepository;

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public GradeResponse createGrade(GradeRequest request) {
        if (gradeRepository.existsByCode(request.getCode().toUpperCase())) {
            throw new AuthException("Grade code already exists: " + request.getCode());
        }

        Grade grade = Grade.builder()
                .name(request.getName())
                .code(request.getCode().toUpperCase())
                .description(request.getDescription())
                .build();

        gradeRepository.save(grade);
        log.info("Grade created: {} - {}", grade.getCode(), grade.getName());
        return toResponse(grade);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    public List<GradeResponse> getAllGrades() {
        return gradeRepository.findAllByActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public GradeResponse getGradeById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Transactional
    public GradeResponse updateGrade(UUID id, GradeRequest request) {
        Grade grade = findOrThrow(id);
        grade.setName(request.getName());
        grade.setCode(request.getCode().toUpperCase());
        grade.setDescription(request.getDescription());
        gradeRepository.save(grade);
        log.info("Grade updated: {}", grade.getCode());
        return toResponse(grade);
    }

    // ── Delete (soft) ─────────────────────────────────────────────────────────

    @Transactional
    public void deactivateGrade(UUID id) {
        Grade grade = findOrThrow(id);
        grade.setActive(false);
        gradeRepository.save(grade);
        log.info("Grade deactivated: {}", grade.getCode());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Grade findOrThrow(UUID id) {
        return gradeRepository.findById(id)
                .orElseThrow(() -> new AuthException("Grade not found: " + id));
    }

    private GradeResponse toResponse(Grade g) {
        return GradeResponse.builder()
                .id(g.getId())
                .name(g.getName())
                .code(g.getCode())
                .description(g.getDescription())
                .active(g.isActive())
                .build();
    }
}