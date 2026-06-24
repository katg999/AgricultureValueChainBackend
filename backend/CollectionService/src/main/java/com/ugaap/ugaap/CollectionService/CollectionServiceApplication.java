package com.ugaap.ugaap.CollectionService;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.cloud.openfeign.EnableFeignClients;


/**
 * Principal entry point configuration class for running the UGAAP Collection Microservice.
 * <p>
 * This microservice manages local weight intakes, crops intake classifications,
 * and handles localized credit data mapping workflows before dispatching delayed 
 * balance recoveries over to the downstream Inventory tracking infrastructure.
 */
@SpringBootApplication
@EnableFeignClients
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class CollectionServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(CollectionServiceApplication.class, args);
    }
}