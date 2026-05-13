package com.jhonycar.backend.dto;

import com.jhonycar.backend.entity.enums.FinanceiroStatus;
import com.jhonycar.backend.entity.enums.FinanceiroTipo;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FinanceiroResponse(
        @Schema(example = "1")
        Long id,
        @Schema(example = "1")
        Long clienteId,
        @Schema(example = "1")
        Long ordemServicoId,
        @Schema(example = "1")
        Long notaFiscalId,
        @Schema(example = "450.00")
        BigDecimal valor,
        @Schema(example = "SERVICO")
        FinanceiroTipo tipo,
        @Schema(example = "PIX")
        String formaPagamento,
        @Schema(example = "PENDENTE")
        FinanceiroStatus status,
        @Schema(example = "2026-04-29")
        LocalDate data,
        @Schema(example = "https://wa.me/5511999998888?text=Ola%20Carlos%2C%20seu%20orcamento...")
        String linkWhatsapp
) {
}
