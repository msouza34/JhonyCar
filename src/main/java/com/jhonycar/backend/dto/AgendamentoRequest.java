package com.jhonycar.backend.dto;

import com.jhonycar.backend.entity.enums.AgendamentoStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record AgendamentoRequest(
        @Schema(description = "ID do cliente", example = "1")
        @NotNull(message = "Cliente e obrigatorio")
        Long clienteId,
        @Schema(description = "ID do veiculo", example = "1")
        @NotNull(message = "Veiculo e obrigatorio")
        Long veiculoId,
        @Schema(description = "Data e hora agendada", example = "2026-05-05T10:00:00")
        @NotNull(message = "Data e hora sao obrigatorias")
        LocalDateTime dataHora,
        @Schema(description = "Descricao do agendamento", example = "Revisao eletrica")
        @NotBlank(message = "Descricao e obrigatoria")
        String descricao,
        @Schema(description = "Status do agendamento", example = "AGENDADO")
        AgendamentoStatus status
) {
}
