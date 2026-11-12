package br.com.sistemas.chamados.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI chamadosOpenAPI() {
        return new OpenAPI().info(new Info()
            .title("API do Sistema de Chamados")
            .description("API REST em arquitetura em camadas com Java e Spring Boot")
            .version("1.0.0"));
    }
}
