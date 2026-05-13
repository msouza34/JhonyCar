package com.jhonycar.backend.controller;

import com.jhonycar.backend.dto.FipeImportResponse;
import com.jhonycar.backend.dto.FipeImportStatusResponse;
import com.jhonycar.backend.service.veiculos.FipeImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "Admin")
@SecurityRequirement(name = "bearerAuth")
public class AdminVeiculoImportController {

    private static final String TENANT_HEADER = "X-Tenant-Id";

    private final FipeImportService fipeImportService;

    @PostMapping("/importar-fipe")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Disparar importacao FIPE de marcas e modelos")
    public ResponseEntity<FipeImportResponse> importarFipe(
            @RequestHeader(value = TENANT_HEADER, required = false) String tenantId
    ) {
        FipeImportStatusResponse statusAtual = fipeImportService.consultarStatus(tenantId);
        if ("PROCESSANDO".equals(statusAtual.status())) {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(new FipeImportResponse(
                    statusAtual.status(),
                    "Importacao FIPE ja esta em andamento",
                    statusAtual.iniciadoEm() == null ? LocalDateTime.now() : statusAtual.iniciadoEm()
            ));
        }

        fipeImportService.importarCatalogoCompletoAsync(tenantId);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(new FipeImportResponse(
                "PROCESSANDO",
                "Importacao FIPE iniciada em background",
                LocalDateTime.now()
        ));
    }

    @GetMapping("/importar-fipe/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Consultar status da importacao FIPE")
    public ResponseEntity<FipeImportStatusResponse> consultarStatusImportacaoFipe(
            @RequestHeader(value = TENANT_HEADER, required = false) String tenantId
    ) {
        return ResponseEntity.ok(fipeImportService.consultarStatus(tenantId));
    }
}
