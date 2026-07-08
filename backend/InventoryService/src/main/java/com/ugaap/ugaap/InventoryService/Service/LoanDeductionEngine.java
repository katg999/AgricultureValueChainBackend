package com.ugaap.ugaap.InventoryService.Service;

import com.ugaap.ugaap.InventoryService.DTO.FinanceBatchDeductionRequestDto;
import com.ugaap.ugaap.InventoryService.Entity.AuditLog;
import com.ugaap.ugaap.InventoryService.Entity.InputCreditLoan;
import com.ugaap.ugaap.InventoryService.Entity.InputCreditLoan.LoanStatus;
import com.ugaap.ugaap.InventoryService.Repository.AuditLogRepository;
import com.ugaap.ugaap.InventoryService.Repository.InputCreditLoanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class LoanDeductionEngine {

    private final InputCreditLoanRepository loanRepository;
    private final AuditLogRepository auditLogRepository;
    private final JdbcTemplate jdbcTemplate;

    public void processFinanceBatch(FinanceBatchDeductionRequestDto request, UUID branchId, UUID userId) {
        guardIdempotency(request.getBatchId());

        List<String> farmerIds = request.getDeductionRecords().stream()
                .map(FinanceBatchDeductionRequestDto.FarmerDeductionRecord::getFarmerId)
                .collect(Collectors.toList());

        List<InputCreditLoan> allLoans = loanRepository.findByFarmerIdInAndStatusIn(
                farmerIds, List.of(LoanStatus.OVERDUE, LoanStatus.ACTIVE));

        for (FinanceBatchDeductionRequestDto.FarmerDeductionRecord record : request.getDeductionRecords()) {
            List<InputCreditLoan> farmerLoans = allLoans.stream()
                    .filter(l -> l.getFarmerId().equals(record.getFarmerId()))
                    .sorted(Comparator.comparing(l -> l.getStatus() == LoanStatus.OVERDUE ? 0 : 1))
                    .collect(Collectors.toList());

            BigDecimal remaining = record.getDeductionAmount();

            for (InputCreditLoan loan : farmerLoans) {
                if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;
                if (loan.isInGracePeriod()) continue;

                BigDecimal apply = remaining.min(loan.getRemainingBalance());
                loan.setAmountPaid(loan.getAmountPaid().add(apply));
                remaining = remaining.subtract(apply);

                if (loan.getAmountPaid().compareTo(loan.getTotalAmountOwed()) >= 0) {
                    loan.setStatus(LoanStatus.PAID);
                    log.info("Loan {} fully repaid via finance batch", loan.getId());
                }

                audit("InputCreditLoan", loan.getId().toString(), "FINANCE_DEDUCTION", userId,
                        String.format("batchId=%s deducted=%s", request.getBatchId(), apply));
            }
        }

        loanRepository.saveAll(allLoans);
        markBatchProcessed(request.getBatchId());
        log.info("Finance batch {} processed for {} farmers", request.getBatchId(), farmerIds.size());
    }

    private void guardIdempotency(String batchId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM inventory.processed_payment_batches WHERE batch_id = ?",
                Integer.class, batchId);
        if (count != null && count > 0) {
            throw new IllegalStateException("Batch already processed: " + batchId);
        }
    }

    private void markBatchProcessed(String batchId) {
        jdbcTemplate.update(
                "INSERT INTO inventory.processed_payment_batches (batch_id, processed_at) VALUES (?, NOW())",
                batchId);
    }

    private void audit(String entityType, String entityId, String action, UUID userId, String changes) {
        if (userId == null) return;
        auditLogRepository.save(AuditLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .performedBy(userId)
                .changes(changes)
                .build());
    }
}
