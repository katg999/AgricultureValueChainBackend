package com.ugaap.ugaap.CollectionService;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

/**
 * Principal entry point configuration class for running the UGAAP Collection Microservice.
 * <p>
 * This microservice manages local weight intakes, crops intake classifications,
 * and handles localized credit data mapping workflows before dispatching delayed 
 * balance recoveries over to the downstream Inventory tracking infrastructure.
 */
@SpringBootApplication
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class CollectionServiceApplication {

    /**
     * Launches the Spring Boot system container context over embedded network runtimes.
     *
     * @param args Standard command-line configuration option inputs.
     */
    public static void main(String[] args) {
        SpringApplication.run(CollectionServiceApplication.class, args);
    }
}