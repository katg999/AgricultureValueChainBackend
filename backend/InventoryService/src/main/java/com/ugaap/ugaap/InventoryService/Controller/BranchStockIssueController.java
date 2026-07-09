package com.ugaap.ugaap.InventoryService.Controller;

import com.ugaap.ugaap.InventoryService.DTO.BranchDisbursementDto;
import com.ugaap.ugaap.InventoryService.DTO.BranchStockIssueRequestDto;
import com.ugaap.ugaap.InventoryService.Service.BranchStockIssueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory/branch-issues")
@RequiredArgsConstructor
@Tag(name = "Branch Stock Issues", description = "Cooperative-to-branch stock disbursement.")
public class BranchStockIssueController {

    private final BranchStockIssueService branchStockIssueService;

    @Operation(summary = "Issue stock from cooperative-level inventory to a branch.")
    @PostMapping
    public ResponseEntity<BranchDisbursementDto> issue(
            @Parameter(in = ParameterIn.HEADER, name = "X-Cooperative-Id",
                       description = "Cooperative UUID", example = "22222222-2222-2222-2222-222222222222")
            @RequestHeader(value = "X-Cooperative-Id", required = false) UUID cooperativeId,
            @Parameter(in = ParameterIn.HEADER, name = "X-User-Id",
                       description = "User UUID", example = "33333333-3333-3333-3333-333333333333")
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @Valid @RequestBody BranchStockIssueRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(branchStockIssueService.issueToBranch(dto, cooperativeId, userId));
    }

    @Operation(summary = "List branch stock issues — branch staff see their own branch, cooperative admin sees all.")
    @GetMapping
    public ResponseEntity<List<BranchDisbursementDto>> list(
            @Parameter(in = ParameterIn.HEADER, name = "X-Branch-Id",
                       description = "Branch UUID", example = "11111111-1111-1111-1111-111111111111")
            @RequestHeader(value = "X-Branch-Id", required = false) UUID branchId,
            @Parameter(in = ParameterIn.HEADER, name = "X-Cooperative-Id",
                       description = "Cooperative UUID", example = "22222222-2222-2222-2222-222222222222")
            @RequestHeader(value = "X-Cooperative-Id", required = false) UUID cooperativeId) {
        List<BranchDisbursementDto> rows = branchId != null
                ? branchStockIssueService.listForBranch(branchId)
                : branchStockIssueService.listForCooperative(cooperativeId);
        return ResponseEntity.ok(rows);
    }
}
