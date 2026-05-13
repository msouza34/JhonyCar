package com.jhonycar.backend.controller;

import com.jhonycar.backend.dto.OrdemServicoRequest;
import com.jhonycar.backend.dto.OrdemServicoResponse;
import com.jhonycar.backend.service.OrdemServicoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ordens-servico")
@RequiredArgsConstructor
@Tag(name = "Ordens de Servico")
@SecurityRequirement(name = "bearerAuth")
public class OrdemServicoController {

    private final OrdemServicoService ordemServicoService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Criar ordem de servico")
    public ResponseEntity<OrdemServicoResponse> create(@Valid @RequestBody OrdemServicoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ordemServicoService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Atualizar ordem de servico", description = "Ao atualizar para FINALIZADO, cria registro financeiro automatico se ainda nao existir.")
    public ResponseEntity<OrdemServicoResponse> update(@PathVariable Long id,
                                                       @Valid @RequestBody OrdemServicoRequest request) {
        return ResponseEntity.ok(ordemServicoService.update(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Buscar ordem de servico por ID")
    public ResponseEntity<OrdemServicoResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ordemServicoService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Listar ordens de servico com paginacao")
    public ResponseEntity<Page<OrdemServicoResponse>> list(@PageableDefault(size = 10) Pageable pageable,
                                                           @RequestParam(required = false) Boolean archived) {
        return ResponseEntity.ok(ordemServicoService.list(pageable, archived));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Excluir ordem de servico")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ordemServicoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
