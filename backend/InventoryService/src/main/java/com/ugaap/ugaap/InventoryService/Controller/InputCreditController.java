package com.ugaap.ugaap.InventoryService.Controller;

import com.ugaap.ugaap.InventoryService.DTO.InputCreditDto;
import com.ugaap.ugaap.InventoryService.DTO.InputCreditSummaryDto;
import com.ugaap.ugaap.InventoryService.DTO.IssueCreditRequestDto;
import com.ugaap.ugaap.InventoryService.DTO.LoanStatusUpdateDto;
import com.ugaap.ugaap.InventoryService.Service.InputCreditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory/credits")
@RequiredArgsConstructor
@Tag(name = "Input Credit Loans", description = "Issue and manage input credit loans for farmers.")
public class InputCreditController {

    private final InputCreditService inputCreditService;

    @Operation(summary = "Issue input credit to a farmer. Auto-creates inventory item if SKU doesn't exist.")
    @PostMapping("/issue")
    public ResponseEntity<InputCreditDto> issueCredit(
            @Parameter(in = ParameterIn.HEADER, name = "X-Branch-Id",
                       description = "Branch UUID", example = "11111111-1111-1111-1111-111111111111", required = true)
            @RequestHeader(value = "X-Branch-Id", required = false) UUID branchId,
            @Parameter(in = ParameterIn.HEADER, name = "X-Cooperative-Id",
                       description = "Cooperative UUID", example = "22222222-2222-2222-2222-222222222222", required = true)
            @RequestHeader(value = "X-Cooperative-Id", required = false) UUID cooperativeId,
            @Parameter(in = ParameterIn.HEADER, name = "X-User-Id",
                       description = "User UUID", example = "33333333-3333-3333-3333-333333333333")
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @Valid @RequestBody IssueCreditRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inputCreditService.issueCredit(dto, branchId, cooperativeId, userId));
    }

    @Operation(summary = "List all input credit loans. Supports ?farmerId=, ?status=ACTIVE|OVERDUE|PAID filters.")
    @GetMapping
    public ResponseEntity<Page<InputCreditDto>> listCredits(
            @Parameter(in = ParameterIn.HEADER, name = "X-Branch-Id",
                       description = "Branch UUID", example = "11111111-1111-1111-1111-111111111111")
            @RequestHeader(value = "X-Branch-Id", required = false) UUID branchId,
            @RequestParam(required = false) String farmerId,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return ResponseEntity.ok(inputCreditService.listCredits(branchId, farmerId, status, pageable));
    }

    @Operation(summary = "Get a single loan by ID.")
    @GetMapping("/{loanId}")
    public ResponseEntity<InputCreditDto> getCredit(@PathVariable UUID loanId) {
        return ResponseEntity.ok(inputCreditService.getCredit(loanId));
    }

    @Operation(summary = "Get all loans for a specific farmer.")
    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<Page<InputCreditDto>> getCreditsByFarmer(
            @PathVariable String farmerId,
            @Parameter(in = ParameterIn.HEADER, name = "X-Branch-Id",
                       description = "Branch UUID", example = "11111111-1111-1111-1111-111111111111")
            @RequestHeader(value = "X-Branch-Id", required = false) UUID branchId,
            Pageable pageable) {
        return ResponseEntity.ok(inputCreditService.getCreditsByFarmer(farmerId, branchId, pageable));
    }

    @Operation(summary = "Manually override a loan status (e.g. OVERDUE, WRITTEN_OFF).")
    @PatchMapping("/{loanId}/status")
    public ResponseEntity<InputCreditDto> updateLoanStatus(
            @PathVariable UUID loanId,
            @Parameter(in = ParameterIn.HEADER, name = "X-User-Id",
                       description = "User UUID", example = "33333333-3333-3333-3333-333333333333")
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @Valid @RequestBody LoanStatusUpdateDto dto) {
        return ResponseEntity.ok(inputCreditService.updateLoanStatus(loanId, dto, userId));
    }
}
