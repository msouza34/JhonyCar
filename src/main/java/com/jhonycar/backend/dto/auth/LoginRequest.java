package com.jhonycar.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import io.swagger.v3.oas.annotations.media.Schema;

public record LoginRequest(
        @Schema(description = "Usuario de acesso", example = "admin")
        @NotBlank(message = "Usuario e obrigatorio")
        String username,
        @Schema(description = "Senha de acesso", example = "admin123")
        @NotBlank(message = "Senha e obrigatoria")
        String password
) {
}
