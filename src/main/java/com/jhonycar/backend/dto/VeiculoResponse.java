package com.jhonycar.backend.dto;

public record VeiculoResponse(
        Long id,
        String placa,
        String modelo,
        String marca,
        Integer ano,
        Long clienteId,
        String clienteNome
) {
}
