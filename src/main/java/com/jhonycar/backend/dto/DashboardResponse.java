package com.jhonycar.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

public record DashboardResponse(
        @Schema(description = "Quantidade total de clientes", example = "25")
        long totalClientes,
        @Schema(description = "Quantidade total de veiculos", example = "40")
        long totalVeiculos,
        @Schema(description = "Quantidade total de ordens de servico", example = "63")
        long totalOrdensServico,
        @Schema(description = "Ordens de servico que ainda nao foram finalizadas", example = "12")
        long ordensEmAberto,
        @Schema(description = "Faturamento mensal com status PAGO", example = "15420.50")
        java.math.BigDecimal faturamentoMensal,
        @Schema(description = "Total de notas em estado ativo/simulado", example = "18")
        long notasEmitidas,
        @Schema(description = "Total de notas canceladas", example = "2")
        long notasCanceladas,
        List<StatusCountResponse> ordensPorStatus
) {
}
