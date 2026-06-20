package com.ugaap.ugaap.CollectionService.Controller;

import com.ugaap.ugaap.CollectionService.DTO.FarmerDeliveryCreateDTO;
import com.ugaap.ugaap.CollectionService.DTO.FarmerDeliveryDTO;
import com.ugaap.ugaap.CollectionService.DTO.FarmerDeliveryUpdateDTO;
import com.ugaap.ugaap.CollectionService.Service.FarmerDeliveryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/branch")
@RequiredArgsConstructor
public class BranchCollectionController {

    private final FarmerDeliveryService farmerDeliveryService;

    // GET /branch/collections — returns all branch-level delivery batches
    @GetMapping("/collections")
    public ResponseEntity<List<FarmerDeliveryDTO>> getBranchCollections(
            @RequestHeader(value = "X-Branch-ID", required = false) String branchId) {
        return ResponseEntity.ok(farmerDeliveryService.searchDeliveries(branchId));
    }

    // GET /branch/farmer-deliveries — returns all farmer-level deliveries
    @GetMapping("/farmer-deliveries")
    public ResponseEntity<List<FarmerDeliveryDTO>> getFarmerDeliveries(
            @RequestHeader(value = "X-Branch-ID", required = false) String branchId) {
        return ResponseEntity.ok(farmerDeliveryService.searchDeliveries(branchId));
    }

    // POST /branch/farmer-deliveries
    @PostMapping("/farmer-deliveries")
    public ResponseEntity<FarmerDeliveryDTO> createFarmerDelivery(
            @Valid @RequestBody FarmerDeliveryCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(farmerDeliveryService.createFarmerDelivery(dto));
    }

    // PUT /branch/farmer-deliveries/{id}
    @PutMapping("/farmer-deliveries/{id}")
    public ResponseEntity<FarmerDeliveryDTO> updateFarmerDelivery(
            @PathVariable UUID id,
            @Valid @RequestBody FarmerDeliveryUpdateDTO dto) {
        return ResponseEntity.ok(farmerDeliveryService.updateDelivery(id, dto));
    }

    // DELETE /branch/farmer-deliveries/{id}
    @DeleteMapping("/farmer-deliveries/{id}")
    public ResponseEntity<Void> deleteFarmerDelivery(@PathVariable UUID id) {
        farmerDeliveryService.deleteFarmerDelivery(id);
        return ResponseEntity.noContent().build();
    }
}