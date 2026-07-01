package com.ugaap.ugaap.InventoryService.Controller;

import com.ugaap.ugaap.InventoryService.DTO.BatchDeductionRequestDto;
import com.ugaap.ugaap.InventoryService.DTO.FinanceBatchDeductionRequestDto;
import com.ugaap.ugaap.InventoryService.DTO.InputCreditSummaryDto;
import com.ugaap.ugaap.InventoryService.DTO.ManualRepaymentDto;
import com.ugaap.ugaap.InventoryService.Service.BatchDeductionService;
import com.ugaap.ugaap.InventoryService.Service.InputCreditService;
import com.ugaap.ugaap.InventoryService.Service.LoanDeductionEngine;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory/deductions")
@RequiredArgsConstructor
@Tag(name = "Repayment & Deductions", description = "Process batch and manual loan repayments.")
public class DeductionController {

    private final BatchDeductionService batchDeductionService;
    private final LoanDeductionEngine loanDeductionEngine;
    private final InputCreditService inputCreditService;

    @Operation(summary = "Triggered after harvest. Deducts loan balances from farmer payouts. Idempotent via batchId.")
    @PostMapping("/batch")
    public ResponseEntity<Void> processBatch(
            @Parameter(in = ParameterIn.HEADER, name = "X-Branch-Id",
                       description = "Branch UUID", example = "11111111-1111-1111-1111-111111111111")
            @RequestHeader(value = "X-Branch-Id", required = false) UUID branchId,
            @Parameter(in = ParameterIn.HEADER, name = "X-User-Id",
                       description = "User UUID", example = "33333333-3333-3333-3333-333333333333")
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @Valid @RequestBody BatchDeductionRequestDto dto) {
        batchDeductionService.processBatch(dto, branchId, userId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Alternative batch endpoint. Accepts raw deduction amounts per farmer. Idempotent via batchId.")
    @PostMapping("/finance-batch")
    public ResponseEntity<Void> processFinanceBatch(
            @Parameter(in = ParameterIn.HEADER, name = "X-Branch-Id",
                       description = "Branch UUID", example = "11111111-1111-1111-1111-111111111111")
            @RequestHeader(value = "X-Branch-Id", required = false) UUID branchId,
            @Parameter(in = ParameterIn.HEADER, name = "X-User-Id",
                       description = "User UUID", example = "33333333-3333-3333-3333-333333333333")
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @Valid @RequestBody FinanceBatchDeductionRequestDto dto) {
        loanDeductionEngine.processFinanceBatch(dto, branchId, userId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Record a single manual repayment (e.g. cash payment at branch).")
    @PostMapping("/manual")
    public ResponseEntity<Void> manualRepayment(
            @Parameter(in = ParameterIn.HEADER, name = "X-User-Id",
                       description = "User UUID", example = "33333333-3333-3333-3333-333333333333")
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @Valid @RequestBody ManualRepaymentDto dto) {
        batchDeductionService.processManualRepayment(dto, userId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Get repayment summary for a farmer — totalOwed, totalPaid, remainingBalance.")
    @GetMapping("/farmer/{farmerId}/summary")
    public ResponseEntity<InputCreditSummaryDto> getFarmerSummary(
            @PathVariable String farmerId,
            @Parameter(in = ParameterIn.HEADER, name = "X-Branch-Id",
                       description = "Branch UUID", example = "11111111-1111-1111-1111-111111111111")
            @RequestHeader(value = "X-Branch-Id", required = false) UUID branchId) {
        return ResponseEntity.ok(inputCreditService.getFarmerSummary(farmerId, branchId));
    }
}
