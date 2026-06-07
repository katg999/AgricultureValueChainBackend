package com.ugaap.shared.security;

/**
 * Holds Module and Action enums used by @RequiresPermission and PermissionCheckAspect.
 * These enum values must stay in sync with com.ugaap.membership.Entity.Permission.
 *
 * NOTE: This is NOT a JPA entity. The membership entity remains in MembershipService.
 */
public class Permission {

    public enum Module {
        MEMBERSHIP,
        INVENTORY,
        REPORTING,
        ACCESS_MANAGEMENT,
        BRANCHES
    }

    public enum Action {
        VIEW,
        CREATE,
        EDIT,
        APPROVE,
        DELETE
    }
}