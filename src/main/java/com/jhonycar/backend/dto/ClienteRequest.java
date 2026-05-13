package com.jhonycar.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

public record ClienteRequest(
        @Schema(description = "Nome completo do cliente", example = "Carlos Silva")
        @NotBlank(message = "Nome e obrigatorio")
        String nome,
        @Schema(description = "CPF ou CNPJ do cliente", example = "12345678901")
        @NotBlank(message = "CPF/CNPJ e obrigatorio")
        String cpfCnpj,
        @Schema(description = "Telefone com DDI/DDD para contato", example = "5511999998888")
        @NotBlank(message = "Telefone e obrigatorio")
        String telefone,
        @Schema(description = "Email do cliente", example = "carlos@cliente.com")
        @NotBlank(message = "Email e obrigatorio")
        @Email(message = "Email invalido")
        String email,
        @Schema(description = "Cliente ativo", example = "true")
        Boolean ativo,
        @Schema(description = "Data de cadastro do cliente", example = "2026-05-05")
        LocalDate dataCadastro,
        @Schema(description = "CEP", example = "01310-100")
        String cep,
        @Schema(description = "Endereco", example = "Avenida Paulista")
        String endereco,
        @Schema(description = "Numero", example = "1578")
        String numero,
        @Schema(description = "Bairro", example = "Bela Vista")
        String bairro,
        @Schema(description = "Cidade", example = "Sao Paulo")
        String cidade,
        @Schema(description = "UF", example = "SP")
        String uf,
        @Schema(description = "Complemento", example = "Sala 12")
        String complemento,
        @Schema(description = "Observacoes internas do cliente", example = "Prefere contato por WhatsApp")
        String observacoes
) {
}
