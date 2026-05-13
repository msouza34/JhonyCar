package com.jhonycar.backend.dto;

import com.jhonycar.backend.entity.enums.OrcamentoStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record OrcamentoResponse(
        @Schema(example = "1")
        Long id,
        @Schema(example = "ORC-0001")
        String numero,
        @Schema(example = "1")
        Long clienteId,
        @Schema(example = "Joao Silva")
        String clienteNome,
        @Schema(example = "5511999999999")
        String clienteTelefone,
        @Schema(example = "joao@email.com")
        String clienteEmail,
        @Schema(example = "1")
        Long veiculoId,
        @Schema(example = "Onix")
        String veiculoModelo,
        @Schema(example = "2022")
        Integer veiculoAno,
        @Schema(example = "ABC1D23")
        String veiculoPlaca,
        @Schema(example = "9BG123456LB123456")
        String veiculoChassi,
        @Schema(example = "PENDENTE")
        OrcamentoStatus status,
        @Schema(example = "2026-05-04T18:21:00")
        LocalDateTime criadoEm,
        @Schema(example = "2026-05-20")
        LocalDate validadeEm,
        @Schema(example = "admin")
        String vendedor,
        @Schema(example = "PIX / Cartao")
        String formaPagamento,
        @Schema(example = "0.00")
        BigDecimal desconto,
        @Schema(example = "570.00")
        BigDecimal valorTotal,
        List<OrcamentoItemResponse> servicos,
        List<OrcamentoItemResponse> pecas,
        @Schema(example = "false")
        Boolean convertidoEmOs,
        @Schema(example = "OS-1020")
        String osNumero,
        @Schema(example = "2026-05-04T18:21:00")
        LocalDateTime atualizadoEm
) {
}

