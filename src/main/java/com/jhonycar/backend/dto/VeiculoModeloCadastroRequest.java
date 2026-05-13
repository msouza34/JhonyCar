package com.jhonycar.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VeiculoModeloCadastroRequest(
        @Schema(description = "Marca do veiculo", example = "Fiat")
        @NotBlank(message = "Marca e obrigatoria")
        @Size(max = 80, message = "Marca deve ter no maximo 80 caracteres")
        String marca,

        @Schema(description = "Modelo do veiculo", example = "Argo")
        @NotBlank(message = "Modelo e obrigatorio")
        @Size(max = 120, message = "Modelo deve ter no maximo 120 caracteres")
        String modelo,

        @Schema(description = "URL da imagem do veiculo", example = "https://cdn.exemplo.com/veiculos/fiat-argo.png")
        String imagemUrl,

        @Schema(description = "Se o modelo esta ativo", example = "true")
        Boolean ativo
) {
}
