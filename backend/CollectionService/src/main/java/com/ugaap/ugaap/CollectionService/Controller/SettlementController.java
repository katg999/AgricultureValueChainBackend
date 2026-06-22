package com.ugaap.ugaap.CollectionService.Controller;

import com.ugaap.ugaap.CollectionService.DTO.BatchSettlementEventDTO;
import com.ugaap.ugaap.CollectionService.DTO.SettlementReceiptDTO;
import com.ugaap.ugaap.CollectionService.Service.FarmerDeliveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Listener mapping inter-service settlement events dispatched by the Payment Microservice.
 */
@RestController
@RequestMapping("/api/v1/settlements")
@RequiredArgsConstructor
@Tag(name = "Settlements", description = "Internal microservice synchronization loops for batch payouts and debt clearance")
public class SettlementController {

    private final FarmerDeliveryService farmerDeliveryService;

    @Operation(summary = "Internal Hook: Callback executed by Payment Service upon batch payout completion")
    @PostMapping("/batch-recover")
    @PreAuthorize("hasAuthority('PERM_EXECUTE_BATCH_PAYMENT')") // Ensures secure service-to-service communication
    public ResponseEntity<SettlementReceiptDTO> processBatchSettlement(
            @Valid @RequestBody BatchSettlementEventDTO settlementEvent,
            HttpServletRequest request) {

        // Extract the Authorization Bearer JWT to securely forward across microservice boundaries
        String authHeader = request.getHeader("Authorization");

        // Forward the array of cleared primary keys down to our business specifications layer
        int successfulRecoveries = farmerDeliveryService.processBatchSettlement(
                settlementEvent.getClearedDeliveryIds(),
                authHeader
        );

        // Return a clean, structured microservice acknowledgement receipt
        SettlementReceiptDTO receipt = new SettlementReceiptDTO(
                settlementEvent.getBatchId(),
                successfulRecoveries,
                "SUCCESS"
        );

        return ResponseEntity.ok(receipt);
    }
}