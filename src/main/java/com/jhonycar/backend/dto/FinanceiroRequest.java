package com.jhonycar.backend.dto;

import com.jhonycar.backend.entity.enums.FinanceiroStatus;
import com.jhonycar.backend.entity.enums.FinanceiroTipo;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FinanceiroRequest(
        @Schema(description = "ID do cliente", example = "1")
        @NotNull(message = "Cliente e obrigatorio")
        Long clienteId,
        @Schema(description = "ID da ordem de servico", example = "1")
        Long ordemServicoId,
        @Schema(description = "Tipo da movimentacao financeira", example = "SERVICO")
        FinanceiroTipo tipo,
        @Schema(description = "Valor da movimentacao financeira", example = "450.00")
        @NotNull(message = "Valor e obrigatorio")
        BigDecimal valor,
        @Schema(description = "Forma de pagamento", example = "PIX")
        @NotBlank(message = "Forma de pagamento e obrigatoria")
        String formaPagamento,
        @Schema(description = "Status financeiro", example = "PENDENTE")
        FinanceiroStatus status,
        @Schema(description = "Data da movimentacao", example = "2026-04-29")
        LocalDate data
) {
}
