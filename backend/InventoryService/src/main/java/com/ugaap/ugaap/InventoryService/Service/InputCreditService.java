package com.ugaap.ugaap.InventoryService.Service;

import com.ugaap.ugaap.InventoryService.DTO.InputCreditDto;
import com.ugaap.ugaap.InventoryService.DTO.InputCreditSummaryDto;
import com.ugaap.ugaap.InventoryService.DTO.IssueCreditRequestDto;
import com.ugaap.ugaap.InventoryService.DTO.LoanStatusUpdateDto;
import com.ugaap.ugaap.InventoryService.Entity.AuditLog;
import com.ugaap.ugaap.InventoryService.Entity.InputCreditLoan;
import com.ugaap.ugaap.InventoryService.Entity.InputCreditLoan.LoanStatus;
import com.ugaap.ugaap.InventoryService.Entity.InventoryItem;
import com.ugaap.ugaap.InventoryService.Repository.AuditLogRepository;
import com.ugaap.ugaap.InventoryService.Repository.InputCreditLoanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InputCreditService {

    private final InputCreditLoanRepository loanRepository;
    private final AuditLogRepository auditLogRepository;
    private final InventoryItemService inventoryItemService;

    public InputCreditDto issueCredit(IssueCreditRequestDto dto, UUID branchId, UUID cooperativeId, UUID userId) {
        InventoryItem item = inventoryItemService.findOrCreateBySku(
                dto.getSku(), branchId, cooperativeId, null, null, null, null);

        BigDecimal totalOwed = item.getSellingPrice().multiply(dto.getQuantity());

        inventoryItemService.decreaseQuantityForIssue(item, dto.getQuantity(), userId);

        InputCreditLoan loan = InputCreditLoan.builder()
                .farmerId(dto.getFarmerId())
                .farmerName(dto.getFarmerName())
                .inventoryItem(item)
                .quantityIssued(dto.getQuantity())
                .totalAmountOwed(totalOwed)
                .amountPaid(BigDecimal.ZERO)
                .status(LoanStatus.ACTIVE)
                .repaymentStrategy(dto.getRepaymentStrategy())
                .customDeductionAmount(dto.getCustomDeductionAmount())
                .gracePeriodEndsAt(dto.getGracePeriodEndsAt())
                .branchId(branchId)
                .cooperativeId(cooperativeId)
                .issuedBy(userId)
                .build();

        loan = loanRepository.save(loan);
        log.info("Input credit issued: loan={} farmer={} amount={}", loan.getId(), dto.getFarmerId(), totalOwed);
        audit("InputCreditLoan", loan.getId().toString(), "ISSUE", userId,
                String.format("sku=%s qty=%s totalOwed=%s", dto.getSku(), dto.getQuantity(), totalOwed));
        return toDto(loan);
    }

    @Transactional(readOnly = true)
    public Page<InputCreditDto> listCredits(UUID branchId, String farmerId, String status, Pageable pageable) {
        Specification<InputCreditLoan> spec = Specification.where(null);

        if (branchId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("branchId"), branchId));
        }
        if (farmerId != null && !farmerId.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("farmerId"), farmerId));
        }
        if (status != null && !status.isBlank()) {
            LoanStatus loanStatus = LoanStatus.valueOf(status.toUpperCase());
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), loanStatus));
        }

        return loanRepository.findAll(spec, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public InputCreditDto getCredit(UUID loanId) {
        return toDto(findLoan(loanId));
    }

    @Transactional(readOnly = true)
    public Page<InputCreditDto> getCreditsByFarmer(String farmerId, UUID branchId, Pageable pageable) {
        Specification<InputCreditLoan> spec = (root, query, cb) -> cb.and(
                cb.equal(root.get("farmerId"), farmerId),
                cb.equal(root.get("branchId"), branchId)
        );
        return loanRepository.findAll(spec, pageable).map(this::toDto);
    }

    public InputCreditDto updateLoanStatus(UUID loanId, LoanStatusUpdateDto dto, UUID userId) {
        InputCreditLoan loan = findLoan(loanId);
        LoanStatus previous = loan.getStatus();
        loan.setStatus(dto.getStatus());
        loan = loanRepository.save(loan);

        audit("InputCreditLoan", loanId.toString(), "STATUS_CHANGE", userId,
                String.format("from=%s to=%s reason=%s", previous, dto.getStatus(), dto.getReason()));
        return toDto(loan);
    }

    @Transactional(readOnly = true)
    public InputCreditSummaryDto getFarmerSummary(String farmerId, UUID branchId) {
        List<InputCreditLoan> loans = loanRepository.findByFarmerIdAndBranchId(farmerId, branchId);

        BigDecimal totalOwed = loans.stream()
                .map(InputCreditLoan::getTotalAmountOwed)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaid = loans.stream()
                .map(InputCreditLoan::getAmountPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<InputCreditSummaryDto.LoanSummaryEntry> entries = loans.stream()
                .map(l -> InputCreditSummaryDto.LoanSummaryEntry.builder()
                        .loanId(l.getId().toString())
                        .itemName(l.getInventoryItem().getItemName())
                        .totalAmountOwed(l.getTotalAmountOwed())
                        .amountPaid(l.getAmountPaid())
                        .remainingBalance(l.getRemainingBalance())
                        .status(l.getStatus())
                        .inGracePeriod(l.isInGracePeriod())
                        .build())
                .collect(Collectors.toList());

        String farmerName = loans.isEmpty() ? null : loans.get(0).getFarmerName();

        return InputCreditSummaryDto.builder()
                .farmerId(farmerId)
                .farmerName(farmerName)
                .totalOwed(totalOwed)
                .totalPaid(totalPaid)
                .remainingBalance(totalOwed.subtract(totalPaid))
                .loans(entries)
                .build();
    }

    private InputCreditLoan findLoan(UUID loanId) {
        return loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found: " + loanId));
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

    InputCreditDto toDto(InputCreditLoan loan) {
        InventoryItem item = loan.getInventoryItem();
        return InputCreditDto.builder()
                .id(loan.getId())
                .farmerId(loan.getFarmerId())
                .farmerName(loan.getFarmerName())
                .itemSku(item != null ? item.getSku() : null)
                .itemName(item != null ? item.getItemName() : null)
                .quantityIssued(loan.getQuantityIssued())
                .totalAmountOwed(loan.getTotalAmountOwed())
                .amountPaid(loan.getAmountPaid())
                .remainingBalance(loan.getRemainingBalance())
                .status(loan.getStatus())
                .repaymentStrategy(loan.getRepaymentStrategy())
                .customDeductionAmount(loan.getCustomDeductionAmount())
                .gracePeriodEndsAt(loan.getGracePeriodEndsAt())
                .inGracePeriod(loan.isInGracePeriod())
                .branchId(loan.getBranchId())
                .createdAt(loan.getCreatedAt())
                .build();
    }
}
