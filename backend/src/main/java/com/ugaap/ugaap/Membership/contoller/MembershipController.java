package com.ugaap.ugaap.Membership.contoller;

import com.ugaap.ugaap.Membership.annotation.RequiresPermission;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/membership")
public class MembershipController {

    @DeleteMapping("/{id}")
    @RequiresPermission(module = "MEMBERSHIP", action = "DELETE") // Triggers MFA Check & Isolation
    public ResponseEntity<?> removeMember(@PathVariable UUID id) {
        // Logic to delete member
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refer")
    @RequiresPermission(module = "MEMBERSHIP", action = "REFER") // Allows Agents
    public ResponseEntity<?> referFarmer(@RequestBody ReferralDTO dto) {
        // Logic to create referral lead
        return ResponseEntity.status(201).build();
    }
}