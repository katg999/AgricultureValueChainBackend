package com.ugaap.shared.client;

import com.ugaap.shared.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthServiceClient {

    private static final String INTERNAL_KEY_HEADER = "X-Internal-Key";

    private final AppProperties appProperties;
    private final RestClient restClient = RestClient.create();

    public CredentialsProvisionResponse provisionCredentials(
            CredentialsProvisionRequest request) {
        log.info("Provisioning credentials for userId={}", request.userId());

        return restClient.post()
                .uri(appProperties.getServices().getAuthServiceUrl()
                        + "/internal/credentials")
                .header(INTERNAL_KEY_HEADER,
                        appProperties.getInternal().getApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(CredentialsProvisionResponse.class);
    }

    public void deactivateCredentials(String userId) {
        log.info("Deactivating credentials for userId={}", userId);

        restClient.delete()
                .uri(appProperties.getServices().getAuthServiceUrl()
                        + "/internal/credentials/" + userId)
                .header(INTERNAL_KEY_HEADER,
                        appProperties.getInternal().getApiKey())
                .retrieve()
                .toBodilessEntity();
    }

    // ── DTOs ──────────────────────────────────────────────────

    public record CredentialsProvisionRequest(
            String userId,
            String username,
            String email,
            String fullName,
            String plainPassword
    ) {}

    public record CredentialsProvisionResponse(
            String userId,
            String username,
            String email
    ) {}
}
