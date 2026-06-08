package com.ugaap.shared.security;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Optional;
import java.util.UUID;

/**
 * Applies PostgreSQL session-level variables before every query so the
 * DB-level Row Level Security policies can scope data correctly.
 *
 * Usage pattern (called from service layer before any query):
 *   rlsContext.applyCurrentUserContext();
 *
 * The corresponding PG policies (V4__rls_policies.sql) read:
 *   current_setting('app.current_tenant_id', true)
 *   current_setting('app.current_branch_id', true)
 *   current_setting('app.bypass_rls', true)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RlsContextApplier {

    private final EntityManager entityManager;
    private final UgaapSecurityContext securityContext;

    /**
     * Sets PostgreSQL session variables from JWT claims so DB RLS policies fire.
     * Must be called inside an active transaction.
     */
    public void applyCurrentUserContext() {
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            log.warn("applyCurrentUserContext() called outside a transaction — RLS variables not set");
            return;
        }

        String tenantId = securityContext.currentTenantId();
        Optional<UUID> branchId = securityContext.currentBranchId();
        boolean bypass = securityContext.hasCrossBranchAccess();

        // ✅ Native queries use positional ?1 ?2 ?3 — NOT :namedParam
        entityManager.createNativeQuery(
                        "SELECT set_config('app.current_tenant_id', ?1, true)")
                .setParameter(1, tenantId)
                .getSingleResult();

        entityManager.createNativeQuery(
                        "SELECT set_config('app.current_branch_id', ?1, true)")
                .setParameter(1, branchId)
                .getSingleResult();

        entityManager.createNativeQuery(
                        "SELECT set_config('app.bypass_rls', ?1, true)")
                .setParameter(1, bypass)
                .getSingleResult();


        log.debug("RLS context applied: tenant={}, branch={}, bypass={}", tenantId, branchId.orElse(null), bypass);
    }
}
