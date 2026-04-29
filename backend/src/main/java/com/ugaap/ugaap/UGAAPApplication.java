package com.ugaap.ugaap;

import com.ugaap.ugaap.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@SpringBootApplication
@EnableAspectJAutoProxy
@EnableConfigurationProperties(AppProperties.class)
public class UGAAPApplication {
	public static void main(String[] args) {
		SpringApplication.run(UGAAPApplication.class, args);
	}
}
