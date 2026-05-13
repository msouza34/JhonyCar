package com.jhonycar.backend.dto;

import java.time.LocalDateTime;

public record FipeImportResponse(
        String status,
        String mensagem,
        LocalDateTime iniciadoEm
) {
}
