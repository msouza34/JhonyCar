package com.jhonycar.backend.controller;

import com.jhonycar.backend.dto.FinanceiroRequest;
import com.jhonycar.backend.dto.FinanceiroResponse;
import com.jhonycar.backend.service.FinanceiroService;
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
@RequestMapping("/financeiro")
@RequiredArgsConstructor
@Tag(name = "Financeiro")
@SecurityRequirement(name = "bearerAuth")
public class FinanceiroController {

    private final FinanceiroService financeiroService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Criar registro financeiro manual")
    public ResponseEntity<FinanceiroResponse> create(@Valid @RequestBody FinanceiroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(financeiroService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Atualizar registro financeiro")
    public ResponseEntity<FinanceiroResponse> update(@PathVariable Long id,
                                                     @Valid @RequestBody FinanceiroRequest request) {
        return ResponseEntity.ok(financeiroService.update(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Buscar registro financeiro por ID")
    public ResponseEntity<FinanceiroResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(financeiroService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Listar registros financeiros com paginacao")
    public ResponseEntity<Page<FinanceiroResponse>> list(@PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(financeiroService.list(pageable));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Excluir registro financeiro")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        financeiroService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
