package com.ugaap.ugaap.InventoryService.Service;

import com.ugaap.ugaap.InventoryService.DTO.BatchDeductionRequestDto;
import com.ugaap.ugaap.InventoryService.DTO.ManualRepaymentDto;
import com.ugaap.ugaap.InventoryService.Entity.AuditLog;
import com.ugaap.ugaap.InventoryService.Entity.InputCreditLoan;
import com.ugaap.ugaap.InventoryService.Entity.InputCreditLoan.LoanStatus;
import com.ugaap.ugaap.InventoryService.Entity.InputCreditLoan.RepaymentStrategy;
import com.ugaap.ugaap.InventoryService.Repository.AuditLogRepository;
import com.ugaap.ugaap.InventoryService.Repository.InputCreditLoanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BatchDeductionService {

    private static final BigDecimal PARTIAL_DEDUCTION_RATE = new BigDecimal("0.5");

    private final InputCreditLoanRepository loanRepository;
    private final AuditLogRepository auditLogRepository;
    private final JdbcTemplate jdbcTemplate;

    public void processBatch(BatchDeductionRequestDto request, UUID branchId, UUID userId) {
        guardIdempotency(request.getBatchId());

        List<String> farmerIds = request.getPayoutRecords().stream()
                .map(BatchDeductionRequestDto.FarmerPayoutRecord::getFarmerId)
                .collect(Collectors.toList());

        List<InputCreditLoan> allLoans = loanRepository.findByFarmerIdInAndStatusIn(
                farmerIds, List.of(LoanStatus.OVERDUE, LoanStatus.ACTIVE));

        for (BatchDeductionRequestDto.FarmerPayoutRecord record : request.getPayoutRecords()) {
            List<InputCreditLoan> farmerLoans = allLoans.stream()
                    .filter(l -> l.getFarmerId().equals(record.getFarmerId()))
                    .sorted(loanPriority())
                    .collect(Collectors.toList());

            BigDecimal available = record.getGrossPayout();

            for (InputCreditLoan loan : farmerLoans) {
                if (available.compareTo(BigDecimal.ZERO) <= 0) break;
                if (loan.isInGracePeriod()) continue;

                BigDecimal deduction = calculateDeduction(loan, available);
                applyDeduction(loan, deduction, userId);
                available = available.subtract(deduction);
            }
        }

        loanRepository.saveAll(allLoans);
        markBatchProcessed(request.getBatchId());
        log.info("Batch {} processed for {} farmers", request.getBatchId(), farmerIds.size());
    }

    public void processManualRepayment(ManualRepaymentDto dto, UUID userId) {
        InputCreditLoan loan = loanRepository.findById(dto.getLoanId())
                .orElseThrow(() -> new RuntimeException("Loan not found: " + dto.getLoanId()));

        BigDecimal deduction = dto.getAmountPaid().min(loan.getRemainingBalance());
        applyDeduction(loan, deduction, userId);
        loanRepository.save(loan);

        audit("InputCreditLoan", loan.getId().toString(), "MANUAL_REPAYMENT", userId,
                String.format("amount=%s method=%s ref=%s",
                        dto.getAmountPaid(), dto.getPaymentMethod(), dto.getReference()));
    }

    private BigDecimal calculateDeduction(InputCreditLoan loan, BigDecimal available) {
        BigDecimal remaining = loan.getRemainingBalance();
        BigDecimal target;

        if (loan.getRepaymentStrategy() == RepaymentStrategy.FULL_DEDUCTION) {
            target = remaining;
        } else if (loan.getCustomDeductionAmount() != null) {
            target = loan.getCustomDeductionAmount();
        } else {
            target = remaining.multiply(PARTIAL_DEDUCTION_RATE).setScale(4, RoundingMode.HALF_UP);
        }

        return target.min(available).min(remaining);
    }

    private void applyDeduction(InputCreditLoan loan, BigDecimal amount, UUID userId) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) return;

        loan.setAmountPaid(loan.getAmountPaid().add(amount));

        if (loan.getAmountPaid().compareTo(loan.getTotalAmountOwed()) >= 0) {
            loan.setStatus(LoanStatus.PAID);
            log.info("Loan {} fully repaid", loan.getId());
        }

        audit("InputCreditLoan", loan.getId().toString(), "DEDUCTION", userId,
                String.format("deducted=%s remaining=%s status=%s", amount, loan.getRemainingBalance(), loan.getStatus()));
    }

    private Comparator<InputCreditLoan> loanPriority() {
        return Comparator.comparing(l -> l.getStatus() == LoanStatus.OVERDUE ? 0 : 1);
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
