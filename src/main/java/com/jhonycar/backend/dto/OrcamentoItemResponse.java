package com.jhonycar.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

public record OrcamentoItemResponse(
        @Schema(example = "1")
        Long id,
        @Schema(example = "Diagnostico eletrico")
        String descricao,
        @Schema(example = "BAT-001")
        String codigo,
        @Schema(example = "1")
        Integer quantidade,
        @Schema(example = "120.00")
        BigDecimal valorUnitario,
        @Schema(example = "Garantia 6 meses")
        String garantia
) {
}

