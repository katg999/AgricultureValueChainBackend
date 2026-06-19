package com.ugaap.configuration.controller;

import com.ugaap.configuration.dto.GradeRequest;
import com.ugaap.configuration.dto.GradeResponse;
import com.ugaap.configuration.service.GradeService;
import com.ugaap.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/grades")
@RequiredArgsConstructor
public class GradeController {

    private final GradeService gradeService;

    @PostMapping
    public ResponseEntity<ApiResponse<GradeResponse>> create(
            @Valid @RequestBody GradeRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok("Grade created", gradeService.createGrade(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<GradeResponse>>> getAll() {
        return ResponseEntity.ok(
                ApiResponse.ok("Grades fetched", gradeService.getAllGrades()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GradeResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.ok("Grade fetched", gradeService.getGradeById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GradeResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody GradeRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok("Grade updated", gradeService.updateGrade(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable UUID id) {
        gradeService.deactivateGrade(id);
        return ResponseEntity.ok(ApiResponse.ok("Grade deactivated", null));
    }
}