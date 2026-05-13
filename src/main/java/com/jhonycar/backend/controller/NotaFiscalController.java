package com.jhonycar.backend.controller;

import com.jhonycar.backend.dto.CancelarNotaRequest;
import com.jhonycar.backend.dto.NotaFiscalResponse;
import com.jhonycar.backend.service.NotaFiscalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notas")
@RequiredArgsConstructor
@Tag(name = "Notas Fiscais")
@SecurityRequirement(name = "bearerAuth")
public class NotaFiscalController {

    private final NotaFiscalService notaFiscalService;

    @PostMapping("/simular/{osId}")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Simular nota fiscal", description = "Gera nota simulada apenas para OS FINALIZADA, cria PDF e vincula ao financeiro.")
    public ResponseEntity<NotaFiscalResponse> simular(@PathVariable Long osId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notaFiscalService.simularPorOrdemServico(osId));
    }

    @PutMapping("/{id}/cancelar")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cancelar nota fiscal", description = "Nao remove a nota. Marca como CANCELADA, grava motivo/data e estorna o financeiro.")
    public ResponseEntity<NotaFiscalResponse> cancelar(@PathVariable Long id,
                                                       @Valid @RequestBody CancelarNotaRequest request) {
        return ResponseEntity.ok(notaFiscalService.cancelar(id, request.motivoCancelamento()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Buscar nota fiscal por ID")
    public ResponseEntity<NotaFiscalResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(notaFiscalService.getById(id));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Baixar/Abrir PDF da nota")
    public ResponseEntity<byte[]> pdf(@PathVariable Long id) {
        NotaFiscalResponse nota = notaFiscalService.getById(id);
        byte[] bytes = notaFiscalService.getPdf(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=" + nota.numero() + ".pdf")
                .body(bytes);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Listar notas fiscais com paginacao")
    public ResponseEntity<Page<NotaFiscalResponse>> list(@PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(notaFiscalService.list(pageable));
    }
}
