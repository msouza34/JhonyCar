package com.jhonycar.backend.controller;

import com.jhonycar.backend.dto.AgendamentoRequest;
import com.jhonycar.backend.dto.AgendamentoResponse;
import com.jhonycar.backend.service.AgendamentoService;
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
@RequestMapping("/agendamentos")
@RequiredArgsConstructor
@Tag(name = "Agendamentos")
@SecurityRequirement(name = "bearerAuth")
public class AgendamentoController {

    private final AgendamentoService agendamentoService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Criar agendamento")
    public ResponseEntity<AgendamentoResponse> create(@Valid @RequestBody AgendamentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(agendamentoService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Atualizar agendamento")
    public ResponseEntity<AgendamentoResponse> update(@PathVariable Long id,
                                                      @Valid @RequestBody AgendamentoRequest request) {
        return ResponseEntity.ok(agendamentoService.update(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Buscar agendamento por ID")
    public ResponseEntity<AgendamentoResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(agendamentoService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Listar agendamentos com paginacao")
    public ResponseEntity<Page<AgendamentoResponse>> list(@PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(agendamentoService.list(pageable));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Excluir agendamento")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        agendamentoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
