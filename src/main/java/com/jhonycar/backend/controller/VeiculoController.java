package com.jhonycar.backend.controller;

import com.jhonycar.backend.dto.VeiculoImagemUploadResponse;
import com.jhonycar.backend.dto.VeiculoModeloCadastroRequest;
import com.jhonycar.backend.dto.VeiculoModeloOptionResponse;
import com.jhonycar.backend.dto.VeiculoRequest;
import com.jhonycar.backend.dto.VeiculoResponse;
import com.jhonycar.backend.service.VeiculoService;
import com.jhonycar.backend.service.veiculos.VeiculoImagemStorageService;
import com.jhonycar.backend.service.veiculos.VeiculoModeloService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/veiculos")
@RequiredArgsConstructor
@Tag(name = "Veiculos")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class VeiculoController {

    private static final String TENANT_HEADER = "X-Tenant-Id";

    private final VeiculoService veiculoService;
    private final VeiculoModeloService veiculoModeloService;
    private final VeiculoImagemStorageService veiculoImagemStorageService;

    @GetMapping("/marcas")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Listar marcas de veiculos")
    public ResponseEntity<List<String>> listarMarcas(@RequestHeader(value = TENANT_HEADER, required = false) String tenantId) {
        return ResponseEntity.ok(veiculoModeloService.listarMarcas(tenantId));
    }

    @GetMapping("/modelos")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Listar modelos por marca")
    public ResponseEntity<List<VeiculoModeloOptionResponse>> listarModelosPorMarca(
            @RequestHeader(value = TENANT_HEADER, required = false) String tenantId,
            @RequestParam @NotBlank(message = "Marca e obrigatoria") String marca
    ) {
        return ResponseEntity.ok(veiculoModeloService.listarModelosPorMarca(tenantId, marca));
    }

    @PostMapping("/modelos")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cadastrar ou atualizar modelo no catalogo")
    public ResponseEntity<VeiculoModeloOptionResponse> cadastrarModelo(
            @RequestHeader(value = TENANT_HEADER, required = false) String tenantId,
            @Valid @RequestBody VeiculoModeloCadastroRequest request
    ) {
        VeiculoModeloOptionResponse response = veiculoModeloService.cadastrarOuAtualizar(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/modelos/{id}/imagem-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Upload de imagem de modelo de veiculo")
    public ResponseEntity<VeiculoImagemUploadResponse> uploadImagemModelo(
            @RequestHeader(value = TENANT_HEADER, required = false) String tenantId,
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file
    ) {
        return ResponseEntity.ok(veiculoModeloService.uploadImagem(tenantId, id, file));
    }

    @GetMapping("/imagens/{fileName:.+}")
    @Operation(summary = "Buscar imagem de veiculo por nome de arquivo")
    public ResponseEntity<Resource> getImagemVeiculo(@PathVariable String fileName) {
        Resource resource = veiculoImagemStorageService.carregarImagemOuPlaceholder(fileName);
        return ResponseEntity.ok()
                .contentType(veiculoImagemStorageService.resolveMediaType(fileName))
                .body(resource);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Criar veiculo")
    public ResponseEntity<VeiculoResponse> create(@Valid @RequestBody VeiculoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(veiculoService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Atualizar veiculo")
    public ResponseEntity<VeiculoResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody VeiculoRequest request) {
        return ResponseEntity.ok(veiculoService.update(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Buscar veiculo por ID")
    public ResponseEntity<VeiculoResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(veiculoService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Listar veiculos com paginacao")
    public ResponseEntity<Page<VeiculoResponse>> list(@PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(veiculoService.list(pageable));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Excluir veiculo")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        veiculoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
