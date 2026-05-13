package com.jhonycar.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import io.swagger.v3.oas.annotations.media.Schema;

public record VeiculoRequest(
        @Schema(description = "Placa do veiculo", example = "ABC1D23")
        @NotBlank(message = "Placa e obrigatoria")
        String placa,
        @Schema(description = "Modelo do veiculo", example = "Onix")
        @NotBlank(message = "Modelo e obrigatorio")
        String modelo,
        @Schema(description = "Marca do veiculo", example = "Chevrolet")
        @NotBlank(message = "Marca e obrigatoria")
        String marca,
        @Schema(description = "Ano de fabricacao", example = "2022")
        @NotNull(message = "Ano e obrigatorio")
        @Min(value = 1900, message = "Ano invalido")
        @Max(value = 2100, message = "Ano invalido")
        Integer ano,
        @Schema(description = "ID do cliente proprietario", example = "1")
        @NotNull(message = "Cliente e obrigatorio")
        Long clienteId
) {
}
