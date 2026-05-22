package com.ugaap.ugaap.shared.security;

import com.ugaap.ugaap.MembershipService.Entity.Permission;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresPermission {
    Permission.Module module();
    Permission.Action action();
}