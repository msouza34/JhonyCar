package com.jhonycar.backend.dto;

import java.time.LocalDateTime;

public record FipeImportStatusResponse(
        String tenantId,
        String status,
        String mensagem,
        LocalDateTime iniciadoEm,
        LocalDateTime atualizadoEm,
        LocalDateTime finalizadoEm,
        Integer totalMarcas,
        Integer marcasProcessadas,
        Integer marcasSucesso,
        Integer marcasComErro,
        Integer modelosInseridos,
        Integer modelosIgnorados
) {
}
