package com.jhonycar.backend.dto;

import com.jhonycar.backend.entity.enums.OrcamentoStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record OrcamentoRequest(
        @Schema(description = "ID do cliente", example = "1")
        @NotNull(message = "Cliente e obrigatorio")
        Long clienteId,
        @Schema(description = "ID do veiculo vinculado", example = "1")
        Long veiculoId,
        @Schema(description = "Modelo do veiculo", example = "Onix")
        @NotBlank(message = "Modelo do veiculo e obrigatorio")
        String veiculoModelo,
        @Schema(description = "Ano do veiculo", example = "2022")
        @NotNull(message = "Ano do veiculo e obrigatorio")
        @Min(value = 1900, message = "Ano invalido")
        @Max(value = 2100, message = "Ano invalido")
        Integer veiculoAno,
        @Schema(description = "Placa do veiculo", example = "ABC1D23")
        @NotBlank(message = "Placa do veiculo e obrigatoria")
        String veiculoPlaca,
        @Schema(description = "Chassi do veiculo", example = "9BG123456LB123456")
        String veiculoChassi,
        @Schema(description = "Status do orcamento", example = "PENDENTE")
        OrcamentoStatus status,
        @Schema(description = "Data de validade do orcamento", example = "2026-05-20")
        @NotNull(message = "Validade e obrigatoria")
        LocalDate validadeEm,
        @Schema(description = "Usuario vendedor responsavel", example = "admin")
        @NotBlank(message = "Vendedor e obrigatorio")
        String vendedor,
        @Schema(description = "Forma de pagamento", example = "PIX / Cartao")
        @NotBlank(message = "Forma de pagamento e obrigatoria")
        String formaPagamento,
        @Schema(description = "Desconto aplicado no orcamento", example = "0.00")
        BigDecimal desconto,
        @Schema(description = "Lista de servicos")
        @NotEmpty(message = "Pelo menos um servico e obrigatorio")
        List<@Valid OrcamentoItemRequest> servicos,
        @Schema(description = "Lista de pecas")
        List<@Valid OrcamentoItemRequest> pecas
) {
}

