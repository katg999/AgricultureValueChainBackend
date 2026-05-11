package com.ugaap.ugaap.Membership.service;

public @interface RequiresPermission {
    String module();

    String action();
}
