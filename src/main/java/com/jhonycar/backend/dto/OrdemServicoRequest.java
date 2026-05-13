package com.jhonycar.backend.dto;

import com.jhonycar.backend.entity.enums.OrdemServicoStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrdemServicoRequest(
        @Schema(description = "ID do cliente", example = "1")
        @NotNull(message = "Cliente e obrigatorio")
        Long clienteId,
        @Schema(description = "ID do veiculo", example = "1")
        @NotNull(message = "Veiculo e obrigatorio")
        Long veiculoId,
        @Schema(description = "Problema informado pelo cliente", example = "Farol nao acende")
        @NotBlank(message = "Problema relatado e obrigatorio")
        String problemaRelatado,
        @Schema(description = "Diagnostico tecnico", example = "Troca de chicote e fusivel")
        String diagnostico,
        @Schema(description = "Valor total previsto/fechado", example = "450.00")
        BigDecimal valorTotal,
        @Schema(description = "Status atual da OS", example = "EM_EXECUCAO")
        OrdemServicoStatus status,
        @Schema(description = "Data/hora de entrada", example = "2026-04-29T09:00:00")
        LocalDateTime dataEntrada,
        @Schema(description = "Data/hora de saida", example = "2026-04-29T17:30:00")
        LocalDateTime dataSaida
) {
}
