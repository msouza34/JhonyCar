package com.jhonycar.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record OrcamentoItemRequest(
        @Schema(description = "Descricao do item", example = "Diagnostico eletrico")
        @NotBlank(message = "Descricao do item e obrigatoria")
        String descricao,
        @Schema(description = "Codigo da peca quando aplicavel", example = "BAT-001")
        String codigo,
        @Schema(description = "Quantidade do item", example = "1")
        @NotNull(message = "Quantidade e obrigatoria")
        @Min(value = 0, message = "Quantidade invalida")
        Integer quantidade,
        @Schema(description = "Valor unitario do item", example = "120.00")
        @NotNull(message = "Valor unitario e obrigatorio")
        BigDecimal valorUnitario,
        @Schema(description = "Garantia aplicada ao item", example = "Garantia 6 meses")
        String garantia
) {
}

