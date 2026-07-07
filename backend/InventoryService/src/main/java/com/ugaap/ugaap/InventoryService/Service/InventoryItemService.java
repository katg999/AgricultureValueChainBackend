package com.ugaap.ugaap.InventoryService.Service;

import com.ugaap.ugaap.InventoryService.DTO.InventoryItemCreateDto;
import com.ugaap.ugaap.InventoryService.DTO.InventoryItemDto;
import com.ugaap.ugaap.InventoryService.DTO.InventoryItemUpdateDto;
import com.ugaap.ugaap.InventoryService.DTO.StockAdjustmentDto;
import com.ugaap.ugaap.InventoryService.Entity.AuditLog;
import com.ugaap.ugaap.InventoryService.Entity.InventoryItem;
import com.ugaap.ugaap.InventoryService.Repository.AuditLogRepository;
import com.ugaap.ugaap.InventoryService.Repository.InventoryItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InventoryItemService {

    private final InventoryItemRepository itemRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public Page<InventoryItemDto> listItems(UUID branchId, String category, String search, Pageable pageable) {
        Specification<InventoryItem> spec = Specification.where(null);

        // Branch staff (X-Branch-Id present) see only their own branch's stock.
        // Cooperative admins (no branch in their JWT) see only the cooperative-level
        // pool (branch_id IS NULL) — not every branch's items lumped together, and
        // not stock that's already been transferred out to a branch.
        spec = branchId != null
                ? spec.and((root, query, cb) -> cb.equal(root.get("branchId"), branchId))
                : spec.and((root, query, cb) -> root.get("branchId").isNull());
        if (category != null && !category.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(cb.lower(root.get("category")), category.toLowerCase()));
        }
        if (search != null && !search.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("itemName")), "%" + search.toLowerCase() + "%"));
        }

        return itemRepository.findAll(spec, pageable).map(this::toDto);
    }

    public InventoryItemDto createItem(InventoryItemCreateDto dto, UUID branchId, UUID cooperativeId, UUID userId) {
        // "Add Stock Item" doubles as "restock an existing commodity" — a fresh batch
        // reference/sku is expected to differ per delivery, so match on item name within
        // the same scope rather than sku, and add to the existing row instead of
        // creating a duplicate for the same product.
        Optional<InventoryItem> existing = findByItemNameInScope(dto.getItemName(), branchId);
        if (existing.isPresent()) {
            return restockExisting(existing.get(), dto, userId);
        }

        InventoryItem item = InventoryItem.builder()
                .sku(dto.getSku())
                .itemName(dto.getItemName())
                .category(dto.getCategory())
                .unitOfMeasure(dto.getUnitOfMeasure())
                .buyingPrice(dto.getBuyingPrice())
                .sellingPrice(dto.getSellingPrice())
                .reorderLevel(dto.getReorderLevel())
                .quantityAvailable(dto.getInitialQuantity() != null ? dto.getInitialQuantity() : BigDecimal.ZERO)
                .branchId(branchId)
                .cooperativeId(cooperativeId)
                .build();

        item = itemRepository.save(item);
        log.info("Inventory item created: {} (SKU: {})", item.getId(), item.getSku());
        audit("InventoryItem", item.getId().toString(), "CREATE", userId, null);
        return toDto(item);
    }

    private Optional<InventoryItem> findByItemNameInScope(String itemName, UUID branchId) {
        Specification<InventoryItem> spec = (root, query, cb) ->
                cb.equal(cb.lower(root.get("itemName")), itemName.toLowerCase());
        spec = branchId != null
                ? spec.and((root, query, cb) -> cb.equal(root.get("branchId"), branchId))
                : spec.and((root, query, cb) -> root.get("branchId").isNull());
        return itemRepository.findAll(spec).stream().findFirst();
    }

    private InventoryItemDto restockExisting(InventoryItem item, InventoryItemCreateDto dto, UUID userId) {
        BigDecimal addedQty = dto.getInitialQuantity() != null ? dto.getInitialQuantity() : BigDecimal.ZERO;
        item.setQuantityAvailable(item.getQuantityAvailable().add(addedQty));
        if (dto.getSellingPrice() != null)  item.setSellingPrice(dto.getSellingPrice());
        if (dto.getBuyingPrice() != null)   item.setBuyingPrice(dto.getBuyingPrice());
        if (dto.getReorderLevel() != null)  item.setReorderLevel(dto.getReorderLevel());

        item = itemRepository.save(item);
        log.info("Inventory item restocked: {} (+{})", item.getId(), addedQty);
        audit("InventoryItem", item.getId().toString(), "RESTOCK", userId,
                String.format("quantity=+%s", addedQty));
        return toDto(item);
    }

    @Transactional(readOnly = true)
    public InventoryItemDto getItem(UUID id) {
        return toDto(findItem(id));
    }

    public InventoryItemDto updateItem(UUID id, InventoryItemUpdateDto dto, UUID userId) {
        InventoryItem item = findItem(id);

        if (dto.getItemName() != null)      item.setItemName(dto.getItemName());
        if (dto.getCategory() != null)      item.setCategory(dto.getCategory());
        if (dto.getUnitOfMeasure() != null) item.setUnitOfMeasure(dto.getUnitOfMeasure());
        if (dto.getBuyingPrice() != null)   item.setBuyingPrice(dto.getBuyingPrice());
        if (dto.getSellingPrice() != null)  item.setSellingPrice(dto.getSellingPrice());
        if (dto.getReorderLevel() != null)  item.setReorderLevel(dto.getReorderLevel());

        item = itemRepository.save(item);
        audit("InventoryItem", id.toString(), "UPDATE", userId, null);
        return toDto(item);
    }

    public InventoryItemDto adjustStock(UUID id, StockAdjustmentDto dto, UUID userId) {
        InventoryItem item = findItem(id);

        BigDecimal newQty = item.getQuantityAvailable().add(dto.getDelta());
        if (newQty.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Stock adjustment would result in negative quantity");
        }

        item.setQuantityAvailable(newQty);
        item = itemRepository.save(item);

        audit("InventoryItem", id.toString(), "STOCK_ADJUST", userId,
                String.format("delta=%s reason=%s", dto.getDelta(), dto.getReason()));
        return toDto(item);
    }

    public InventoryItem decreaseQuantityForIssue(InventoryItem item, BigDecimal quantity, UUID userId) {
        BigDecimal newQty = item.getQuantityAvailable().subtract(quantity);
        if (newQty.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Insufficient stock: only " + item.getQuantityAvailable() + " available");
        }

        item.setQuantityAvailable(newQty);
        item = itemRepository.save(item);

        audit("InventoryItem", item.getId().toString(), "STOCK_ISSUE", userId,
                String.format("quantity=-%s", quantity));
        return item;
    }

    // Credits `quantity` to the branch's copy of `sourceItem` (same sku, scoped to targetBranchId),
    // creating that branch-scoped item on first issue. Used by branch stock disbursement — the
    // counterpart deduction from sourceItem happens separately via decreaseQuantityForIssue.
    public InventoryItem creditBranchStock(InventoryItem sourceItem, UUID targetBranchId, UUID cooperativeId,
                                            BigDecimal quantity, UUID userId) {
        InventoryItem branchItem = itemRepository.findBySkuAndBranchId(sourceItem.getSku(), targetBranchId)
                .orElseGet(() -> InventoryItem.builder()
                        .sku(sourceItem.getSku())
                        .itemName(sourceItem.getItemName())
                        .category(sourceItem.getCategory())
                        .unitOfMeasure(sourceItem.getUnitOfMeasure())
                        .buyingPrice(sourceItem.getBuyingPrice())
                        .sellingPrice(sourceItem.getSellingPrice())
                        .reorderLevel(sourceItem.getReorderLevel())
                        .quantityAvailable(BigDecimal.ZERO)
                        .branchId(targetBranchId)
                        .cooperativeId(cooperativeId)
                        .build());

        branchItem.setQuantityAvailable(branchItem.getQuantityAvailable().add(quantity));
        branchItem = itemRepository.save(branchItem);

        audit("InventoryItem", branchItem.getId().toString(), "STOCK_CREDIT", userId,
                String.format("quantity=+%s (branch issue from %s)", quantity, sourceItem.getId()));
        return branchItem;
    }

    @Transactional(readOnly = true)
    public Page<InventoryItemDto> getLowStockItems(UUID branchId, Pageable pageable) {
        Specification<InventoryItem> spec = (root, query, cb) -> {
            var lowStockPredicate = cb.and(
                    root.get("reorderLevel").isNotNull(),
                    cb.lessThanOrEqualTo(root.get("quantityAvailable"), root.get("reorderLevel"))
            );
            if (branchId != null) {
                return cb.and(cb.equal(root.get("branchId"), branchId), lowStockPredicate);
            }
            return lowStockPredicate;
        };

        return itemRepository.findAll(spec, pageable).map(this::toDto);
    }

    InventoryItem findOrCreateBySku(String sku, UUID branchId, UUID cooperativeId,
                                    BigDecimal sellingPrice, BigDecimal buyingPrice,
                                    String itemName, String unitOfMeasure) {
        return itemRepository.findBySkuAndBranchId(sku, branchId).orElseGet(() -> {
            InventoryItem newItem = InventoryItem.builder()
                    .sku(sku)
                    .itemName(itemName != null ? itemName : sku)
                    .category("INPUT")
                    .unitOfMeasure(unitOfMeasure != null ? unitOfMeasure : "UNIT")
                    .buyingPrice(buyingPrice != null ? buyingPrice : BigDecimal.ZERO)
                    .sellingPrice(sellingPrice != null ? sellingPrice : BigDecimal.ZERO)
                    .quantityAvailable(BigDecimal.ZERO)
                    .reorderLevel(BigDecimal.ZERO)
                    .branchId(branchId)
                    .cooperativeId(cooperativeId)
                    .build();
            log.info("Auto-created inventory item for SKU: {}", sku);
            return itemRepository.save(newItem);
        });
    }

    private InventoryItem findItem(UUID id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory item not found: " + id));
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

    public InventoryItemDto toDto(InventoryItem item) {
        BigDecimal qty = item.getQuantityAvailable() != null ? item.getQuantityAvailable() : BigDecimal.ZERO;
        BigDecimal reorder = item.getReorderLevel() != null ? item.getReorderLevel() : BigDecimal.ZERO;
        return InventoryItemDto.builder()
                .id(item.getId())
                .sku(item.getSku())
                .itemName(item.getItemName())
                .category(item.getCategory())
                .unitOfMeasure(item.getUnitOfMeasure())
                .buyingPrice(item.getBuyingPrice())
                .sellingPrice(item.getSellingPrice())
                .quantityAvailable(qty)
                .reorderLevel(reorder)
                .lowStock(qty.compareTo(reorder) <= 0)
                .branchId(item.getBranchId())
                .cooperativeId(item.getCooperativeId())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
