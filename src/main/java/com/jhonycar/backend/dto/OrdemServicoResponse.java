package com.jhonycar.backend.dto;

import com.jhonycar.backend.entity.enums.OrdemServicoStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrdemServicoResponse(
        Long id,
        Long clienteId,
        String clienteNome,
        Long veiculoId,
        String veiculoPlaca,
        String problemaRelatado,
        String diagnostico,
        BigDecimal valorTotal,
        OrdemServicoStatus status,
        LocalDateTime dataEntrada,
        LocalDateTime dataSaida,
        boolean archived,
        LocalDateTime updatedAt
) {
}
