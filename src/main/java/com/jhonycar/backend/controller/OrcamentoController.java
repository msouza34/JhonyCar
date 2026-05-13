package com.jhonycar.backend.controller;

import com.jhonycar.backend.dto.OrcamentoConverterRequest;
import com.jhonycar.backend.dto.OrcamentoRequest;
import com.jhonycar.backend.dto.OrcamentoResponse;
import com.jhonycar.backend.entity.enums.OrcamentoStatus;
import com.jhonycar.backend.service.OrcamentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orcamentos")
@RequiredArgsConstructor
@Tag(name = "Orcamentos")
@SecurityRequirement(name = "bearerAuth")
public class OrcamentoController {

    private final OrcamentoService orcamentoService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Criar orcamento")
    public ResponseEntity<OrcamentoResponse> create(@Valid @RequestBody OrcamentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orcamentoService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Atualizar orcamento")
    public ResponseEntity<OrcamentoResponse> update(@PathVariable Long id,
                                                    @Valid @RequestBody OrcamentoRequest request) {
        return ResponseEntity.ok(orcamentoService.update(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Buscar orcamento por ID")
    public ResponseEntity<OrcamentoResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orcamentoService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Listar orcamentos")
    public ResponseEntity<List<OrcamentoResponse>> list(@RequestParam(required = false) Long clienteId) {
        return ResponseEntity.ok(orcamentoService.list(clienteId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Excluir orcamento")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        orcamentoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Atualizar status do orcamento")
    public ResponseEntity<OrcamentoResponse> updateStatus(@PathVariable Long id,
                                                          @RequestParam OrcamentoStatus status) {
        return ResponseEntity.ok(orcamentoService.updateStatus(id, status));
    }

    @PostMapping("/{id}/converter")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Marcar orcamento como convertido em OS")
    public ResponseEntity<OrcamentoResponse> converter(@PathVariable Long id,
                                                       @RequestBody(required = false) OrcamentoConverterRequest request) {
        return ResponseEntity.ok(orcamentoService.converterEmOs(id, request));
    }

    @PostMapping("/{id}/duplicar")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Duplicar orcamento")
    public ResponseEntity<OrcamentoResponse> duplicate(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orcamentoService.duplicate(id));
    }
}

