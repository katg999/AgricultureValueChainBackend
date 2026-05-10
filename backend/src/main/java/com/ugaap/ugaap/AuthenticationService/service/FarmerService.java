package com.ugaap.ugaap.service;

import com.ugaap.ugaap.domain.Client;
import com.ugaap.ugaap.repository.ClientRepository;
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
        for (PayrollAdjustment adj : adjustments) {
            // 1. Calculate: Gross Produce Value - In-Kind Credit Value = Net Payout
            double netPayout = adj.getGrossValue() - adj.getManualDeduction();

            // 2. Queue for Bank Transfer (Payroll file generation)
            prepareBankTransfer(adj.getFarmerId(), netPayout);

            // 3. Mark as "Paid" in the system
            updateFarmerPaymentStatus(adj.getFarmerId(), "PAID");
        }

        // 4. Notify Farmers via SMS/Alert
        sendBatchNotifications(adjustments);
    }
}