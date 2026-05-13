package com.jhonycar.backend.dto;

import com.jhonycar.backend.entity.enums.NotaFiscalStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record NotaFiscalResponse(
        @Schema(example = "1")
        Long id,
        @Schema(example = "NF-0001")
        String numero,
        @Schema(example = "Carlos Silva")
        String clienteNome,
        @Schema(example = "12345678901")
        String cpfCnpj,
        @Schema(example = "Troca de chicote e fusivel")
        String descricaoServico,
        @Schema(example = "450.00")
        BigDecimal valor,
        @Schema(example = "SIMULADA")
        NotaFiscalStatus status,
        @Schema(example = "2026-04-29T14:30:00")
        LocalDateTime dataEmissao,
        @Schema(example = "Cancelamento solicitado pelo cliente")
        String motivoCancelamento,
        @Schema(example = "2026-04-29T16:10:00")
        LocalDateTime dataCancelamento,
        @Schema(example = "1")
        Long ordemServicoId,
        @Schema(example = "http://localhost:8080/notas/1/pdf")
        String linkPdf,
        @Schema(example = "https://wa.me/5511999998888?text=Ola%20Carlos%2C%20segue%20sua%20nota%3A...")
        String linkWhatsapp
) {
}
