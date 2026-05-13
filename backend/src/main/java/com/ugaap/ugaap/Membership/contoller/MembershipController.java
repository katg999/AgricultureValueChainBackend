package com.ugaap.ugaap.Membership.contoller;

import com.ugaap.ugaap.AuthenticationService.Entity.Client;
import com.ugaap.ugaap.AuthenticationService.Repository.ClientRepository;
import com.ugaap.ugaap.Membership.annotation.RequiresPermission;
import com.ugaap.ugaap.dto.UserResponseDTO;
import com.ugaap.ugaap.Membership.entity.Cooperative;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/membership")
public class MembershipController {

    @Autowired
    private ClientRepository clientRepository;

    @DeleteMapping("/{id}")
    @RequiresPermission(module = "MEMBERSHIP", action = "DELETE") // Triggers MFA Check & Isolation
    public ResponseEntity<?> removeMember(@PathVariable UUID id) {
        // Logic to delete member
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refer")
    @RequiresPermission(module = "MEMBERSHIP", action = "REFER") // Allows Agents
    public ResponseEntity<?> referFarmer(@RequestBody Object dto) {
        // Logic to create referral lead
        return ResponseEntity.status(201).build();
    }


    /**
     * UPDATE: Updates existing user info.
     * Fields like 'email' or 'id' are usually protected from updates.
     */
    @Transactional
    @RequiresPermission(module = "MEMBERSHIP", action = "UPDATE")
    public Client updateUser(UUID id, Client updateData) {
        Client existingUser = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only update allowable fields
        existingUser.setCompanyName(updateData.getCompanyName());
        // Do not update ID or Cooperative to prevent data leaks

        return clientRepository.save(existingUser);
    }

    /**
     * DEACTIVATE: Soft-delete logic.
     * Flips 'active' status to false.
     */
    @Transactional
    @RequiresPermission(module = "MEMBERSHIP", action = "DEACTIVATE")
    public void deactivateUser(UUID id) {
        Client user = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus("INACTIVE");
        // user.setActive(false); // Assuming you have an 'active' boolean
        clientRepository.save(user);
    }

    /**
     * READ: Fetches users and maps them to DTOs to hide sensitive data.
     */
    @Transactional(readOnly = true)
    public List<UserResponseDTO> findAllByCooperative(Cooperative cooperative) {
        return clientRepository.findByCooperative(cooperative)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    private UserResponseDTO convertToDTO(Client client) {
        return UserResponseDTO.builder()
                .id(client.getId())
                .email(client.getEmail())
                .companyName(client.getCompanyName())
                .status(String.valueOf(client.getStatus()))
                .isApproved(client.isApprovedByAdmin())
                .cooperativeName(client.getCooperative() != null ? client.getCooperative().toString() : "N/A")
                .build();
    }
}