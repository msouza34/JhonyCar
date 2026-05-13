package com.jhonycar.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Bean
    public OpenAPI openAPI() {
        String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("JhonyCar API")
                        .description("API SaaS de gestao para auto eletrica com fluxo OS -> Nota -> Financeiro.")
                        .version("v1")
                        .contact(new Contact()
                                .name("Equipe JhonyCar")))
                .servers(List.of(new Server().url(baseUrl).description("Ambiente configurado")))
                .tags(List.of(
                        new Tag().name("Auth").description("Autenticacao e token JWT"),
                        new Tag().name("Clientes").description("Gestao de clientes e central consolidada"),
                        new Tag().name("Veiculos").description("Cadastro e consulta de veiculos"),
                        new Tag().name("Ordens de Servico").description("Fluxo da ordem de servico"),
                        new Tag().name("Financeiro").description("Registros financeiros e status"),
                        new Tag().name("Notas Fiscais").description("Nota simulada, PDF e cancelamento"),
                        new Tag().name("Agendamentos").description("Agenda de carros"),
                        new Tag().name("Dashboard").description("Indicadores e visao gerencial"),
                        new Tag().name("Integracoes").description("Links de notificacao via WhatsApp")
                ))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components().addSecuritySchemes(
                        securitySchemeName,
                        new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                ));
    }
}
