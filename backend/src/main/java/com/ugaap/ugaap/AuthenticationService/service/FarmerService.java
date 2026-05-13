package com.ugaap.ugaap.AuthenticationService.service;

import com.ugaap.ugaap.AuthenticationService.Entity.Client;
import com.ugaap.ugaap.AuthenticationService.Repository.ClientRepository;
import com.ugaap.ugaap.dto.PayrollAdjustment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FarmerService {

    private final ClientRepository clientRepository;

    /**
     * Retrieves farmers visible to a specific Manager.
     * Logic: Find all agents assigned to this manager, then find all farmers onboarded by those agents.
     */
    public List<Client> getFarmersForManager(UUID managerId) {
        return clientRepository.findFarmersByManagerHierarchy(managerId);
    }

    /**
     * Processes Batch Payroll.
     * Farmers receive their net payout after Coop Admin has manually
     * deducted the value of "in-kind" credits (seedlings, etc.).
     */
    @Transactional
    public void executeBatchPayroll(UUID cooperativeId, List<PayrollAdjustment> adjustments) {

    }

    private void sendBatchNotifications(List<PayrollAdjustment> adjustments) {
    }
}