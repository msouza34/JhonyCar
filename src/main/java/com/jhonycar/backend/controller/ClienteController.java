package com.jhonycar.backend.controller;

import com.jhonycar.backend.dto.ClienteCentralResponse;
import com.jhonycar.backend.dto.ClienteDetalhesResponse;
import com.jhonycar.backend.dto.ClienteRequest;
import com.jhonycar.backend.dto.ClienteResponse;
import com.jhonycar.backend.service.ClienteService;
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
@RequestMapping("/clientes")
@RequiredArgsConstructor
@Tag(name = "Clientes")
@SecurityRequirement(name = "bearerAuth")
public class ClienteController {

    private final ClienteService clienteService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Criar cliente")
    public ResponseEntity<ClienteResponse> create(@Valid @RequestBody ClienteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clienteService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Atualizar cliente")
    public ResponseEntity<ClienteResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody ClienteRequest request) {
        return ResponseEntity.ok(clienteService.update(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Buscar cliente por ID")
    public ResponseEntity<ClienteResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(clienteService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Listar clientes com paginacao")
    public ResponseEntity<Page<ClienteResponse>> list(@PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(clienteService.list(pageable));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Excluir cliente")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        clienteService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/central")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Central do cliente", description = "Retorna dados consolidados do cliente, veiculos, ordens, financeiro, notas e agendamentos.")
    public ResponseEntity<ClienteCentralResponse> central(@PathVariable Long id) {
        return ResponseEntity.ok(clienteService.getCentral(id));
    }

    @GetMapping("/{id}/detalhes")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Detalhes integrados do cliente", description = "Retorna cliente, veiculos, ordens, orcamentos e financeiro.")
    public ResponseEntity<ClienteDetalhesResponse> detalhes(@PathVariable Long id) {
        return ResponseEntity.ok(clienteService.getDetalhes(id));
    }
}
