package com.ugaap.ugaap.InventoryService.Service;

import com.ugaap.ugaap.InventoryService.DTO.BranchDisbursementDto;
import com.ugaap.ugaap.InventoryService.DTO.BranchStockIssueRequestDto;
import com.ugaap.ugaap.InventoryService.Entity.AuditLog;
import com.ugaap.ugaap.InventoryService.Entity.BranchStockIssue;
import com.ugaap.ugaap.InventoryService.Entity.InventoryItem;
import com.ugaap.ugaap.InventoryService.Repository.AuditLogRepository;
import com.ugaap.ugaap.InventoryService.Repository.BranchStockIssueRepository;
import com.ugaap.ugaap.InventoryService.Repository.InventoryItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class BranchStockIssueService {

    private final BranchStockIssueRepository issueRepository;
    private final InventoryItemRepository itemRepository;
    private final InventoryItemService inventoryItemService;
    private final AuditLogRepository auditLogRepository;

    public BranchDisbursementDto issueToBranch(BranchStockIssueRequestDto dto, UUID cooperativeId, UUID userId) {
        InventoryItem sourceItem = itemRepository.findById(dto.getStockItemId())
                .orElseThrow(() -> new RuntimeException("Stock item not found: " + dto.getStockItemId()));

        // X-Cooperative-Id isn't always present (depends on the caller's JWT claims) —
        // the item itself already carries the cooperative that owns it, so prefer that
        // over trusting the header alone.
        UUID resolvedCooperativeId = cooperativeId != null ? cooperativeId : sourceItem.getCooperativeId();

        inventoryItemService.decreaseQuantityForIssue(sourceItem, dto.getQuantity(), userId);
        InventoryItem branchItem = inventoryItemService.creditBranchStock(
                sourceItem, dto.getBranchId(), resolvedCooperativeId, dto.getQuantity(), userId);

        BigDecimal totalValue = sourceItem.getSellingPrice().multiply(dto.getQuantity());

        BranchStockIssue issue = BranchStockIssue.builder()
                .sourceItem(sourceItem)
                .branchItem(branchItem)
                .targetBranchId(dto.getBranchId())
                .itemName(sourceItem.getItemName())
                .itemCategory(sourceItem.getCategory())
                .unitOfMeasure(sourceItem.getUnitOfMeasure())
                .quantity(dto.getQuantity())
                .totalValue(totalValue)
                .cooperativeId(resolvedCooperativeId)
                .issuedBy(userId)
                .build();
        issue = issueRepository.save(issue);

        log.info("Branch stock issue: sku={} branch={} qty={}", sourceItem.getSku(), dto.getBranchId(), dto.getQuantity());
        audit(issue.getId().toString(), userId,
                String.format("sku=%s branchId=%s qty=%s totalValue=%s",
                        sourceItem.getSku(), dto.getBranchId(), dto.getQuantity(), totalValue));

        return toDto(issue);
    }

    @Transactional(readOnly = true)
    public List<BranchDisbursementDto> listForBranch(UUID branchId) {
        return issueRepository.findByTargetBranchIdOrderByCreatedAtDesc(branchId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BranchDisbursementDto> listForCooperative(UUID cooperativeId) {
        // "WHERE cooperative_id = NULL" never matches any row in SQL, even ones that
        // are themselves null — so a missing header must fall back to listing everything
        // rather than silently returning an empty list.
        List<BranchStockIssue> rows = cooperativeId != null
                ? issueRepository.findByCooperativeIdOrderByCreatedAtDesc(cooperativeId)
                : issueRepository.findAllByOrderByCreatedAtDesc();
        return rows.stream().map(this::toDto).collect(Collectors.toList());
    }

    private void audit(String entityId, UUID userId, String changes) {
        if (userId == null) return;
        auditLogRepository.save(AuditLog.builder()
                .entityType("BranchStockIssue")
                .entityId(entityId)
                .action("ISSUE")
                .performedBy(userId)
                .changes(changes)
                .build());
    }

    // Reads only the snapshot columns and the shadow id column — never dereferences
    // issue.getSourceItem()/getBranchItem(), so a deleted inventory item can't 500 this.
    private BranchDisbursementDto toDto(BranchStockIssue issue) {
        return BranchDisbursementDto.builder()
                .id(issue.getId())
                .stockItemId(issue.getSourceItemId())
                .branchId(issue.getTargetBranchId())
                .branchName("")
                .itemName(issue.getItemName())
                .itemType(issue.getItemCategory())
                .quantity(issue.getQuantity())
                .unit(issue.getUnitOfMeasure())
                .totalValue(issue.getTotalValue())
                .issueDate(issue.getCreatedAt().toLocalDate().toString())
                .status(issue.getStatus().name().toLowerCase())
                .build();
    }
}
