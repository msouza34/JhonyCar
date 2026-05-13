package com.jhonycar.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public record OrcamentoConverterRequest(
        @Schema(description = "Numero da OS vinculada", example = "OS-1234")
        String osNumero
) {
}

