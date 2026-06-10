package com.ugaap.shared.security;

import com.ugaap.shared.security.Permission;
import com.ugaap.shared.Exception.AuthException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.List;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class PermissionCheckAspect {

    private final UgaapSecurityContext securityContext;

    @Before("@annotation(com.ugaap.shared.security.RequiresPermission)")
    public void checkPermission(JoinPoint joinPoint) {
        MethodSignature signature =
                (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();

        RequiresPermission annotation =
                method.getAnnotation(RequiresPermission.class);

        Permission.Module requiredModule = annotation.module();
        Permission.Action requiredAction = annotation.action();

        String requiredPermission =
                requiredModule.name() + ":" + requiredAction.name();

        List<String> userPermissions = securityContext.currentPermissions();

        if (!userPermissions.contains(requiredPermission)) {
            log.warn("Access denied — user={} missing permission={}",
                    securityContext.currentUsername(), requiredPermission);
            throw new AuthException(
                    "Access denied: missing permission "
                            + requiredPermission);
        }
    }
}