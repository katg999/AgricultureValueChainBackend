package com.ugaap.shared.client;

import com.ugaap.shared.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class MembershipServiceClient {

    private static final String INTERNAL_KEY_HEADER = "X-Internal-Key";

    private final AppProperties appProperties;
    private final RestClient restClient = RestClient.create();

    public TokenClaimsResponse getTokenClaims(String userId) {
        log.info("Fetching token claims for userId={}", userId);

        return restClient.get()
                .uri(appProperties.getServices().getMembershipServiceUrl()
                        + "/internal/users/" + userId + "/token-claims")
                .header(INTERNAL_KEY_HEADER,
                        appProperties.getInternal().getApiKey())
                .retrieve()
                .body(TokenClaimsResponse.class);
    }

    // ── DTOs ──────────────────────────────────────────────────

    public record TokenClaimsResponse(
            String userId,
            String username,
            String tenantId,
            String branchId,
            List<String> roles,
            List<String> permissions
    ) {}
}