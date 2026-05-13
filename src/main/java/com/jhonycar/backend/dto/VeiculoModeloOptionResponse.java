package com.jhonycar.backend.dto;

public record VeiculoModeloOptionResponse(
        Long id,
        String marca,
        String modelo,
        String imagemUrl
) {
}
