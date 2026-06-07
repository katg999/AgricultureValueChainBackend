package com.ugaap.membership.service;

import com.ugaap.membership.dto.AccessManagementDto;
import com.ugaap.membership.dto.MakerCheckerDto;
import com.ugaap.membership.repository.RoleRepository;
import com.ugaap.shared.Exception.AuthException;
import com.ugaap.shared.util.MinioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MakerCheckerService {

    private final UserService    userService;
    private final RoleRepository roleRepository;
    private final MinioService   minioService;

    @Transactional
    public MakerCheckerDto.CreateResponse createMakerAndChecker(
            MakerCheckerDto.CreateRequest request,
            MultipartFile makerPhoto,
            MultipartFile checkerPhoto) {

        // 1. Look up MAKER role for this tenant
        var makerRole = roleRepository
                .findByNameAndTenantId("COOPERATIVE_ADMIN_MAKER", request.getTenantId())
                .orElseThrow(() -> new AuthException(
                        "COOPERATIVE_ADMIN_MAKER role not found for tenant: "
                                + request.getTenantId()));

        // 2. Look up CHECKER role for this tenant
        var checkerRole = roleRepository
                .findByNameAndTenantId("COOPERATIVE_ADMIN_CHECKER", request.getTenantId())
                .orElseThrow(() -> new AuthException(
                        "COOPERATIVE_ADMIN_CHECKER role not found for tenant: "
                                + request.getTenantId()));

        // 3. Create Maker user
        AccessManagementDto.UserResponse makerUser = userService.createUser(
                AccessManagementDto.CreateUserRequest.builder()
                        .fullName(request.getMakerFullName())
                        .email(request.getMakerEmail())
                        .phone(request.getMakerPhone())
                        .tenantId(request.getTenantId())
                        .roleId(makerRole.getRoleId())
                        .build(),
                "SYSTEM"
        );

        // 4. Upload Maker photo
        String makerPhotoUrl = uploadPhotoOrDefault(
                makerPhoto, request.getTenantId(),
                makerUser.getUserId(), request.getMakerFullName());

        // 5. Create Checker user
        AccessManagementDto.UserResponse checkerUser = userService.createUser(
                AccessManagementDto.CreateUserRequest.builder()
                        .fullName(request.getCheckerFullName())
                        .email(request.getCheckerEmail())
                        .phone(request.getCheckerPhone())
                        .tenantId(request.getTenantId())
                        .roleId(checkerRole.getRoleId())
                        .build(),
                "SYSTEM"
        );

        // 6. Upload Checker photo
        String checkerPhotoUrl = uploadPhotoOrDefault(
                checkerPhoto, request.getTenantId(),
                checkerUser.getUserId(), request.getCheckerFullName());

        log.info("Maker & Checker created for tenantId={}", request.getTenantId());

        return MakerCheckerDto.CreateResponse.builder()
                .maker(MakerCheckerDto.AccountCredentials.builder()
                        .userId(makerUser.getUserId())
                        .username(makerUser.getUsername())
                        .fullName(makerUser.getFullName())
                        .email(makerUser.getEmail())
                        .temporaryPassword(makerUser.getTemporaryPassword())
                        .role("COOPERATIVE_ADMIN_MAKER")
                        .photoUrl(makerPhotoUrl)
                        .build())
                .checker(MakerCheckerDto.AccountCredentials.builder()
                        .userId(checkerUser.getUserId())
                        .username(checkerUser.getUsername())
                        .fullName(checkerUser.getFullName())
                        .email(checkerUser.getEmail())
                        .temporaryPassword(checkerUser.getTemporaryPassword())
                        .role("COOPERATIVE_ADMIN_CHECKER")
                        .photoUrl(checkerPhotoUrl)
                        .build())
                .message("Maker and Checker accounts created successfully")
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────

    private String uploadPhotoOrDefault(
            MultipartFile photo,
            String tenantId,
            String userId,
            String fullName) {

        if (photo != null && !photo.isEmpty()) {
            return minioService.uploadProfilePhoto(photo, tenantId, userId);
        }
        return minioService.generateDefaultAvatar(fullName);
    }
}