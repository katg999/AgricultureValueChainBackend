package com.ugaap.membership.service;


import com.ugaap.membership.Entity.Cooperative;
import com.ugaap.membership.Entity.Member;
import com.ugaap.membership.dto.MemberDto;
import com.ugaap.membership.repository.CooperativeRepository;
import com.ugaap.membership.repository.MemberRepository;
import com.ugaap.shared.Exception.AuthException; //Look here
import com.ugaap.shared.util.MinioService;      //look here
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;


@Slf4j
@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository     memberRepository;
    private final CooperativeRepository cooperativeRepository;
    private final MinioService         minioService;




    //Register a UGAAP FARMER
    @Transactional
    public MemberDto.Response registerMember(
            MemberDto.CreateRequest request,
            MultipartFile photo,
            String registeredBy) {

        // 1. National ID uniqueness check
        if (memberRepository.existsByNationalId(request.getNationalId())) {
            throw new AuthException(
                    "Member with National ID '"
                            + request.getNationalId()
                            + "' is already registered");
        }

        // 2. Validate cooperative exists
        Cooperative cooperative = cooperativeRepository
                .findById(request.getCooperativeId())
                .orElseThrow(() -> new AuthException(
                        "Cooperative not found: "
                                + request.getCooperativeId()));

        // 3. Generate member ID early (needed for photo path)

        String tempId = UUID.randomUUID().toString();

        // 4. Handle photo upload
        String photoUrl;
        if (photo != null && !photo.isEmpty()) {
            photoUrl = minioService.uploadProfilePhoto(
                    photo,
                    request.getTenantId(),
                    tempId
            );
        } else {
            // Use generated avatar as default
            photoUrl = minioService.generateDefaultAvatar(
                    request.getFullName());
        }

        // 5. Build and save member
        Member member = Member.builder()
                .fullName(request.getFullName())
                .nationalId(request.getNationalId())
                .phoneNumber(request.getPhoneNumber())
                .gender(request.getGender())
                .email(request.getEmail())
                .dateOfBirth(request.getDateOfBirth())
                .profilePhotoUrl(photoUrl)
                .farmRegion(request.getFarmRegion())
                .villageTown(request.getVillageTown())
                .totalLandAreaHectares(request.getTotalLandAreaHectares())
                .landOwnershipType(request.getLandOwnershipType())
                .primaryCrops(request.getPrimaryCrops())
                .cattleCount(request.getCattleCount())
                .goatsCount(request.getGoatsCount())
                .poultryCount(request.getPoultryCount())
                .cooperative(cooperative)
                .tenantId(request.getTenantId())
                .branchId(request.getBranchId())
                .status(Member.MemberStatus.ACTIVE)
                .registeredBy(registeredBy)
                .build();

        memberRepository.save(member);
        log.info("Member registered: nationalId={}, tenantId={}",
                request.getNationalId(), request.getTenantId());

        return mapToResponse(member);
    }

    // ── Get member ────────────────────────────────────────────

    public MemberDto.Response getMember(String memberId) {
        Member member = memberRepository
                .findById(UUID.fromString(memberId))
                .orElseThrow(() -> new AuthException(
                        "Member not found: " + memberId));
        return mapToResponse(member);
    }

    // ── List members ──────────────────────────────────────────

    public List<MemberDto.Response> listMembers(
            String tenantId, String branchId) {

        List<Member> members = branchId != null
                ? memberRepository.findAllByTenantIdAndBranchId(
                tenantId, UUID.fromString(branchId))
                : memberRepository.findAllByTenantId(tenantId);

        return members.stream()
                .map(this::mapToResponse)
                .toList();
    }


    // ── Update member ─────────────────────────────────────────

    @Transactional
    public MemberDto.Response updateMember(
            String memberId,
            MemberDto.CreateRequest request,
            MultipartFile photo) {

        Member member = memberRepository
                .findById(UUID.fromString(memberId))
                .orElseThrow(() -> new AuthException(
                        "Member not found: " + memberId));

        // Update photo if provided
        if (photo != null && !photo.isEmpty()) {
            String photoUrl = minioService.uploadProfilePhoto(
                    photo,
                    member.getTenantId(),
                    memberId
            );
            member.setProfilePhotoUrl(photoUrl);
        }

        member.setFullName(request.getFullName());
        member.setPhoneNumber(request.getPhoneNumber());
        member.setEmail(request.getEmail());
        member.setDateOfBirth(request.getDateOfBirth());
        member.setFarmRegion(request.getFarmRegion());
        member.setVillageTown(request.getVillageTown());
        member.setTotalLandAreaHectares(request.getTotalLandAreaHectares());
        member.setLandOwnershipType(request.getLandOwnershipType());
        member.setPrimaryCrops(request.getPrimaryCrops());
        member.setCattleCount(request.getCattleCount());
        member.setGoatsCount(request.getGoatsCount());
        member.setPoultryCount(request.getPoultryCount());

        memberRepository.save(member);
        log.info("Member updated: memberId={}", memberId);

        return mapToResponse(member);
    }

    // ── Deactivate member ─────────────────────────────────────

    @Transactional
    public void deactivateMember(String memberId) {
        Member member = memberRepository
                .findById(UUID.fromString(memberId))
                .orElseThrow(() -> new AuthException(
                        "Member not found: " + memberId));

        member.setStatus(Member.MemberStatus.INACTIVE);
        memberRepository.save(member);
        log.info("Member deactivated: memberId={}", memberId);
    }


    // ── Helper ────────────────────────────────────────────────

    private MemberDto.Response mapToResponse(Member member) {
        return MemberDto.Response.builder()
                .memberId(member.getMemberId().toString())
                .fullName(member.getFullName())
                .nationalId(member.getNationalId())
                .phoneNumber(member.getPhoneNumber())
                .gender(member.getGender().name())
                .email(member.getEmail())
                .dateOfBirth(member.getDateOfBirth() != null
                        ? member.getDateOfBirth().toString() : null)
                .profilePhotoUrl(member.getProfilePhotoUrl())
                .farmRegion(member.getFarmRegion().name())
                .villageTown(member.getVillageTown())
                .totalLandAreaHectares(member.getTotalLandAreaHectares())
                .landOwnershipType(member.getLandOwnershipType() != null
                        ? member.getLandOwnershipType().name() : null)
                .primaryCrops(member.getPrimaryCrops() != null
                        ? member.getPrimaryCrops().stream()
                          .map(Enum::name).toList()
                        : List.of())
                .cattleCount(member.getCattleCount())
                .goatsCount(member.getGoatsCount())
                .poultryCount(member.getPoultryCount())
                .cooperativeId(member.getCooperative()
                        .getCooperativeId().toString())
                .tenantId(member.getTenantId())
                .branchId(member.getBranchId().toString())
                .status(member.getStatus().name())
                .registeredBy(member.getRegisteredBy())
                .createdAt(member.getCreatedAt() != null
                        ? member.getCreatedAt().toString() : null)
                .build();
    }



}
