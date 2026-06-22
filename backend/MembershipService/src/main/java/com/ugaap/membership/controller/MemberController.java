package com.ugaap.membership.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ugaap.membership.dto.MemberDto;
import com.ugaap.membership.service.MemberService;
import com.ugaap.shared.security.UgaapSecurityContext; // look here
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final UgaapSecurityContext securityContext;
    private final ObjectMapper objectMapper;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('BRANCH_MANAGER') or hasRole('FIELD_AGENT') " +
            "or hasRole('COOPERATIVE_ADMIN_MAKER')"  +
            "or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<MemberDto.Response> registerMember(
            @RequestPart("data") String requestJson,
            @RequestPart(value = "photo", required = false)
            MultipartFile photo) throws Exception {

        MemberDto.CreateRequest request = objectMapper.readValue(
                requestJson, MemberDto.CreateRequest.class);

        String registeredBy = securityContext.currentUsername();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(memberService.registerMember(
                        request, photo, registeredBy));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MemberDto.Response>> listMembers(
            @RequestParam String tenantId,
            @RequestParam(required = false) String branchId) {
        return ResponseEntity.ok(
                memberService.listMembers(tenantId, branchId));
    }

    @GetMapping("/{memberId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MemberDto.Response> getMember(
            @PathVariable String memberId) {
        return ResponseEntity.ok(memberService.getMember(memberId));
    }

    @PutMapping(value = "/{memberId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('BRANCH_MANAGER') or hasRole('FIELD_AGENT') " +
            "or hasRole('COOPERATIVE_ADMIN_MAKER')")
    public ResponseEntity<MemberDto.Response> updateMember(
            @PathVariable String memberId,
            @RequestPart("data") String requestJson,
            @RequestPart(value = "photo", required = false)
            MultipartFile photo) throws Exception {

        MemberDto.CreateRequest request = objectMapper.readValue(
                requestJson, MemberDto.CreateRequest.class);

        return ResponseEntity.ok(
                memberService.updateMember(memberId, request, photo));
    }

    @DeleteMapping("/{memberId}")
    @PreAuthorize("hasRole('BRANCH_MANAGER') " +
            "or hasRole('COOPERATIVE_ADMIN_MAKER')")
    public ResponseEntity<Void> deactivateMember(
            @PathVariable String memberId) {
        memberService.deactivateMember(memberId);
        return ResponseEntity.noContent().build();
    }
}