package com.ugaap.ugaap.CollectionService.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class CollectionSecurityConfig {

    @Bean
    public SecurityFilterChain collectionSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // This stops the 403 error on POST requests
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/deliveries/**").permitAll()
                .anyRequest().permitAll()
            );
            
        return http.build();
    }
}