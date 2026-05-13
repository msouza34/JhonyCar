package com.jhonycar.backend.dto;

import com.jhonycar.backend.entity.enums.AgendamentoStatus;

import java.time.LocalDateTime;

public record AgendamentoResponse(
        Long id,
        Long clienteId,
        String clienteNome,
        Long veiculoId,
        String veiculoPlaca,
        LocalDateTime dataHora,
        String descricao,
        AgendamentoStatus status
) {
}
