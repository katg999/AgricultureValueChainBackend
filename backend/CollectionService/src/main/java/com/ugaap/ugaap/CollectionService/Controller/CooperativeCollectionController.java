package com.ugaap.ugaap.CollectionService.Controller;

import com.ugaap.ugaap.CollectionService.DTO.FarmerDeliveryListDTO;
import com.ugaap.ugaap.CollectionService.DTO.SessionConfigDTO;
import com.ugaap.ugaap.CollectionService.DTO.SeasonConfigDTO;
import com.ugaap.ugaap.CollectionService.Service.FarmerDeliveryService;
import com.ugaap.ugaap.CollectionService.Service.SeasonConfigService;
import com.ugaap.ugaap.CollectionService.Service.SessionConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cooperative")
@RequiredArgsConstructor
public class CooperativeCollectionController {

    private final FarmerDeliveryService farmerDeliveryService;
    private final SessionConfigService sessionConfigService;
    private final SeasonConfigService seasonConfigService;

    // GET /cooperative/collections
    @GetMapping("/collections")
    public ResponseEntity<List<FarmerDeliveryListDTO>> getCooperativeCollections() {
        return ResponseEntity.ok(farmerDeliveryService.getAllFarmerDeliveriesWithTotalValue());
    }

    // GET /cooperative/session-config
    @GetMapping("/session-config")
    public ResponseEntity<List<SessionConfigDTO>> getSessionConfig(
            @RequestHeader(value = "X-Cooperative-ID", required = false) String cooperativeId) {
        return ResponseEntity.ok(sessionConfigService.getSessionConfig(cooperativeId));
    }

    // GET /cooperative/season-config
    @GetMapping("/season-config")
    public ResponseEntity<List<SeasonConfigDTO>> getSeasonConfig(
            @RequestHeader(value = "X-Cooperative-ID", required = false) String cooperativeId) {
        return ResponseEntity.ok(seasonConfigService.getSeasonConfigsByCooperative(cooperativeId));
    }

    // PUT /cooperative/session-config
    @PutMapping("/session-config")
    public ResponseEntity<Void> updateSessionConfig(
            @RequestHeader(value = "X-Cooperative-ID", required = false) String cooperativeId,
            @RequestBody List<SessionConfigDTO> windows) {
        sessionConfigService.updateSessionConfig(cooperativeId, windows);
        return ResponseEntity.ok().build();
    }
}