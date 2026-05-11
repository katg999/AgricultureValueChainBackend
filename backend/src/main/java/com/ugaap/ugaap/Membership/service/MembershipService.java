package com.ugaap.ugaap.Membership.service;

import com.ugaap.ugaap.AuthenticationService.Entity.Client;
import com.ugaap.ugaap.Membership.annotation.RequiresPermission;
import com.ugaap.ugaap.Membership.domain.Cooperative;
import com.ugaap.ugaap.Membership.domain.SaccoConfig;
import com.ugaap.ugaap.Membership.repository.SaccoConfigRepository;
import com.ugaap.ugaap.AuthenticationService.Repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MembershipService {

    private final ClientRepository clientRepository;
    private final SaccoConfigRepository configRepository;

    /**
     * MAKER STEP: Create a Branch Manager.
     * Permission: MEMBERSHIP_CREATE
     */
    @RequiresPermission(module = "MEMBERSHIP", action = "CREATE")
    @Transactional
    public Client createBranchManager(Client managerData, Client creator) {
        // Find config by the Sacco name
        SaccoConfig config = configRepository.findByCooperative((Cooperative) creator.getCooperative())
                .orElseThrow(() -> new RuntimeException("Sacco configuration not found"));

        managerData.setCooperative(creator.getCooperative());
        managerData.setOnboardedBy(creator);

        // DYNAMIC LOGIC: Check if Maker-Checker is required
        if (config.isEnforceMakerCheckerForStaff()) {
            managerData.setApprovedByAdmin(false);
            managerData.setStatus("PENDING_CHECKER_APPROVAL");
        } else {
            managerData.setApprovedByAdmin(true);
            managerData.setStatus("ACTIVE");
        }

        return clientRepository.save(managerData);
    }

}