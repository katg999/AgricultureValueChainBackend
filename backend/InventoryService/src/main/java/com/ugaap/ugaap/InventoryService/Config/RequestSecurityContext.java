package com.ugaap.ugaap.InventoryService.Config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

@Component
public class RequestSecurityContext {

    private static final String KEY_COOPERATIVE_ID = "ctx.cooperativeId";
    private static final String KEY_BRANCH_ID      = "ctx.branchId";
    private static final String KEY_USER_ID        = "ctx.userId";

    public void setCooperativeId(UUID id) { set(KEY_COOPERATIVE_ID, id); }
    public void setBranchId(UUID id)      { set(KEY_BRANCH_ID, id); }
    public void setUserId(UUID id)        { set(KEY_USER_ID, id); }

    public UUID getCooperativeId() { return get(KEY_COOPERATIVE_ID); }
    public UUID getBranchId()      { return get(KEY_BRANCH_ID); }
    public UUID getUserId()        { return get(KEY_USER_ID); }

    private void set(String key, UUID value) {
        request().setAttribute(key, value);
    }

    private UUID get(String key) {
        return (UUID) request().getAttribute(key);
    }

    private HttpServletRequest request() {
        return ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
    }
}
