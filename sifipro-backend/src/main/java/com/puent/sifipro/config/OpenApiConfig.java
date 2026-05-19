package com.puent.sifipro.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

        @Bean
        public OpenAPI sifiproOpenAPI() {
                return new OpenAPI()
                                .components(new Components()
                                                .addSecuritySchemes("bearerAuth",
                                                                new SecurityScheme()
                                                                                .type(SecurityScheme.Type.HTTP)
                                                                                .scheme("bearer")
                                                                                .bearerFormat("JWT")
                                                                                .description("JWT Bearer token authentication")))
                                .info(new Info()
                                                .title("SIFIPRO Loyalty API")
                                                .description("REST API for the SIFIPRO academic MVP, including customer enrollment, rewards, points issuance, redemptions, and dashboard reports.")
                                                .version("v1.0.0")
                                                .contact(new Contact()
                                                                .name("SIFIPRO Team")
                                                                .email("team@sifipro.local"))
                                                .license(new License()
                                                                .name("Academic Use Only")));
        }
}