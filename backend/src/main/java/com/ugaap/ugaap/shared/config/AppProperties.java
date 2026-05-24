package com.ugaap.ugaap.shared.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@EnableConfigurationProperties
@ConfigurationProperties(prefix = "app")



public class AppProperties {

    private final Jwt jwt = new Jwt();
    private final Internal internal = new Internal();
    private final Services services = new Services();

    private final Minio minio = new Minio();

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private long accessTokenExpiryMs;
        private long refreshTokenExpiryMs;
    }

    @Getter
    @Setter
    public static class Internal {
        private String apiKey;
    }

    @Getter
    @Setter
    public static class Services {
        private String authServiceUrl;
        private String membershipServiceUrl;
    }


    @Getter
    @Setter
    public static class Minio {
        private String endpoint;
        private String accessKey;
        private String secretKey;
        private String bucket;
    }
}



