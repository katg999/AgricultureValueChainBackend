package com.ugaap.ugaap.CollectionService.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Enterprise configuration layer managing cross-service HTTP client configurations.
 */
@Configuration
public class RestTemplateConfig {

    /**
     * Instantiates a production-tuned RestTemplate bean instance.
     * Includes absolute boundary timeouts to safeguard execution thread starvation
     * if downstream networks or destination nodes experience lag.
     *
     * @return Fully configured RestTemplate instance.
     */
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        
        // Define boundary parameters to prevent infinite request hangs
        factory.setConnectTimeout(5000); // 5 Seconds limits initial handshake waits
        factory.setReadTimeout(10000);   // 10 Seconds limits data stream transmission waits
        
        return new RestTemplate(factory);
    }
}