package com.jhonycar.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record CancelarNotaRequest(
        @Schema(description = "Motivo do cancelamento da nota", example = "Cancelamento solicitado pelo cliente")
        @NotBlank(message = "Motivo do cancelamento e obrigatorio")
        String motivoCancelamento
) {
}
