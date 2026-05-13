package com.jhonycar.backend.service.veiculos;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jhonycar.backend.dto.FipeImportStatusResponse;
import com.jhonycar.backend.entity.VeiculoModelo;
import com.jhonycar.backend.repository.VeiculoModeloRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
public class FipeImportService {

    private static final String STATUS_IDLE = "IDLE";
    private static final String STATUS_PROCESSANDO = "PROCESSANDO";
    private static final String STATUS_CONCLUIDO = "CONCLUIDO";
    private static final String STATUS_CONCLUIDO_COM_ERROS = "CONCLUIDO_COM_ERROS";
    private static final String STATUS_FALHA = "FALHA";

    private final ObjectMapper objectMapper;
    private final VeiculoModeloRepository veiculoModeloRepository;
    private final VeiculoModeloService veiculoModeloService;
    private final VeiculoImagemStorageService imagemStorageService;

    @Value("${app.fipe.base-url:https://parallelum.com.br/fipe/api/v1}")
    private String fipeBaseUrl;

    private RestClient restClient;
    private final Map<String, ImportStatusSnapshot> statusPorTenant = new ConcurrentHashMap<>();

    @PostConstruct
    void init() {
        this.restClient = RestClient.builder()
                .baseUrl(fipeBaseUrl)
                .build();
    }

    public FipeImportStatusResponse consultarStatus(String tenantId) {
        String tenant = normalizeTenant(tenantId);
        ImportStatusSnapshot snapshot = statusPorTenant.getOrDefault(tenant, idleSnapshot(tenant));
        return toResponse(snapshot);
    }

    @Async("fipeImportExecutor")
    public void importarCatalogoCompletoAsync(String tenantId) {
        String tenant = normalizeTenant(tenantId);

        AtomicBoolean iniciou = new AtomicBoolean(false);
        LocalDateTime inicio = LocalDateTime.now();

        statusPorTenant.compute(tenant, (key, atual) -> {
            if (atual != null && STATUS_PROCESSANDO.equals(atual.status())) {
                return atual;
            }
            iniciou.set(true);
            return new ImportStatusSnapshot(
                    tenant,
                    STATUS_PROCESSANDO,
                    "Importacao FIPE iniciada em background",
                    inicio,
                    inicio,
                    null,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
            );
        });

        if (!iniciou.get()) {
            log.info("FIPE import ignorado. tenant='{}' ja possui importacao em andamento", tenant);
            return;
        }

        log.info("FIPE import iniciado. tenant='{}'", tenant);

        int totalMarcas = 0;
        int marcasProcessadas = 0;
        int marcasSucesso = 0;
        int marcasComErro = 0;
        int modelosInseridos = 0;
        int modelosIgnorados = 0;

        try {
            List<FipeMarcaPayload> marcas = buscarMarcas();
            totalMarcas = marcas.size();
            atualizarStatusProcessando(tenant, inicio, totalMarcas, marcasProcessadas, marcasSucesso, marcasComErro, modelosInseridos,
                    modelosIgnorados, "Marcas FIPE carregadas");

            for (int index = 0; index < marcas.size(); index += 1) {
                FipeMarcaPayload marca = marcas.get(index);
                String nomeMarca = sanitize(marca.nome());
                String codigoMarca = sanitize(marca.codigo());

                if (nomeMarca.isBlank() || codigoMarca.isBlank()) {
                    log.warn("FIPE import: marca invalida ignorada no indice {}", index);
                    marcasProcessadas += 1;
                    marcasComErro += 1;
                    atualizarStatusProcessando(tenant, inicio, totalMarcas, marcasProcessadas, marcasSucesso, marcasComErro,
                            modelosInseridos, modelosIgnorados,
                            "Marca invalida ignorada no indice " + index);
                    continue;
                }

                try {
                    MarcaImportResult result = importarModelosDaMarca(nomeMarca, codigoMarca);
                    modelosInseridos += result.inseridos();
                    modelosIgnorados += result.ignorados();
                    marcasSucesso += 1;
                    marcasProcessadas += 1;

                    log.info("FIPE import [{} / {}] marca='{}' inseridos={} ignorados={}",
                            index + 1, totalMarcas, nomeMarca, result.inseridos(), result.ignorados());
                    atualizarStatusProcessando(tenant, inicio, totalMarcas, marcasProcessadas, marcasSucesso, marcasComErro,
                            modelosInseridos, modelosIgnorados,
                            "Marca processada: " + nomeMarca);
                } catch (Exception marcaEx) {
                    marcasComErro += 1;
                    marcasProcessadas += 1;
                    log.warn("FIPE import [{} / {}] falha na marca='{}' codigo='{}': {}",
                            index + 1, totalMarcas, nomeMarca, codigoMarca, marcaEx.getMessage());
                    atualizarStatusProcessando(tenant, inicio, totalMarcas, marcasProcessadas, marcasSucesso, marcasComErro,
                            modelosInseridos, modelosIgnorados,
                            "Falha na marca: " + nomeMarca);
                }
            }

            veiculoModeloService.invalidarCacheCatalogo(tenant);

            LocalDateTime finalizadoEm = LocalDateTime.now();
            String statusFinal = marcasComErro > 0 ? STATUS_CONCLUIDO_COM_ERROS : STATUS_CONCLUIDO;
            String mensagemFinal = marcasComErro > 0
                    ? "Importacao concluida com erros por marca"
                    : "Importacao concluida com sucesso";

            statusPorTenant.put(tenant, new ImportStatusSnapshot(
                    tenant,
                    statusFinal,
                    mensagemFinal,
                    inicio,
                    finalizadoEm,
                    finalizadoEm,
                    totalMarcas,
                    marcasProcessadas,
                    marcasSucesso,
                    marcasComErro,
                    modelosInseridos,
                    modelosIgnorados
            ));

            log.info("FIPE import concluido. tenant='{}' totalMarcas={} sucesso={} erros={} modelosInseridos={} modelosIgnorados={}",
                    tenant, totalMarcas, marcasSucesso, marcasComErro, modelosInseridos, modelosIgnorados);
        } catch (Exception ex) {
            LocalDateTime finalizadoEm = LocalDateTime.now();

            statusPorTenant.put(tenant, new ImportStatusSnapshot(
                    tenant,
                    STATUS_FALHA,
                    "Importacao abortada: " + sanitize(ex.getMessage()),
                    inicio,
                    finalizadoEm,
                    finalizadoEm,
                    totalMarcas,
                    marcasProcessadas,
                    marcasSucesso,
                    marcasComErro,
                    modelosInseridos,
                    modelosIgnorados
            ));

            log.error("FIPE import abortado por erro geral. tenant='{}' marcasProcessadas={} erro={}",
                    tenant, marcasProcessadas, ex.getMessage(), ex);
        }
    }

    private List<FipeMarcaPayload> buscarMarcas() throws Exception {
        String payload = restClient.get()
                .uri("/carros/marcas")
                .retrieve()
                .body(String.class);

        if (payload == null || payload.isBlank()) {
            return List.of();
        }

        return objectMapper.readValue(payload, new TypeReference<>() {
        });
    }

    private MarcaImportResult importarModelosDaMarca(String nomeMarca, String codigoMarca) throws Exception {
        String payload = restClient.get()
                .uri("/carros/marcas/{codigo}/modelos", codigoMarca)
                .retrieve()
                .body(String.class);

        if (payload == null || payload.isBlank()) {
            return new MarcaImportResult(0, 0);
        }

        Map<String, Object> root = objectMapper.readValue(payload, new TypeReference<>() {
        });
        Object modelosRaw = root.get("modelos");

        if (!(modelosRaw instanceof List<?> modelosFipe)) {
            return new MarcaImportResult(0, 0);
        }

        List<VeiculoModelo> existentes = veiculoModeloRepository.findByMarcaOrderByModeloAsc(nomeMarca);
        Set<String> modelosExistentes = new HashSet<>();
        for (VeiculoModelo item : existentes) {
            modelosExistentes.add(normalizeKey(item.getModelo()));
        }

        List<VeiculoModelo> novos = new ArrayList<>();
        int ignorados = 0;

        for (Object entry : modelosFipe) {
            if (!(entry instanceof Map<?, ?> modeloMap)) {
                ignorados += 1;
                continue;
            }

            Object nomeRaw = modeloMap.get("nome");
            String nomeModelo = sanitize(nomeRaw == null ? "" : String.valueOf(nomeRaw));
            if (nomeModelo.isBlank()) {
                ignorados += 1;
                continue;
            }

            String modeloKey = normalizeKey(nomeModelo);
            if (modelosExistentes.contains(modeloKey)) {
                ignorados += 1;
                continue;
            }

            VeiculoModelo novo = VeiculoModelo.builder()
                    .marca(nomeMarca)
                    .modelo(nomeModelo)
                    .imagemUrl(imagemStorageService.placeholderUrlFor(nomeMarca, nomeModelo))
                    .ativo(true)
                    .build();

            novos.add(novo);
            modelosExistentes.add(modeloKey);
        }

        if (!novos.isEmpty()) {
            veiculoModeloRepository.saveAll(novos);
        }

        return new MarcaImportResult(novos.size(), ignorados);
    }

    private String sanitize(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\s+", " ").trim();
    }

    private String normalizeKey(String value) {
        return sanitize(value).toLowerCase(Locale.ROOT);
    }

    private String normalizeTenant(String tenantId) {
        String tenant = sanitize(tenantId);
        return tenant.isBlank() ? "default" : tenant.toLowerCase(Locale.ROOT);
    }

    private ImportStatusSnapshot idleSnapshot(String tenant) {
        LocalDateTime now = LocalDateTime.now();
        return new ImportStatusSnapshot(
                tenant,
                STATUS_IDLE,
                "Importacao ainda nao foi executada",
                null,
                now,
                null,
                0,
                0,
                0,
                0,
                0,
                0
        );
    }

    private void atualizarStatusProcessando(String tenant,
                                            LocalDateTime inicio,
                                            int totalMarcas,
                                            int marcasProcessadas,
                                            int marcasSucesso,
                                            int marcasComErro,
                                            int modelosInseridos,
                                            int modelosIgnorados,
                                            String mensagem) {
        statusPorTenant.put(tenant, new ImportStatusSnapshot(
                tenant,
                STATUS_PROCESSANDO,
                mensagem,
                inicio,
                LocalDateTime.now(),
                null,
                totalMarcas,
                marcasProcessadas,
                marcasSucesso,
                marcasComErro,
                modelosInseridos,
                modelosIgnorados
        ));
    }

    private FipeImportStatusResponse toResponse(ImportStatusSnapshot snapshot) {
        return new FipeImportStatusResponse(
                snapshot.tenantId(),
                snapshot.status(),
                snapshot.mensagem(),
                snapshot.iniciadoEm(),
                snapshot.atualizadoEm(),
                snapshot.finalizadoEm(),
                snapshot.totalMarcas(),
                snapshot.marcasProcessadas(),
                snapshot.marcasSucesso(),
                snapshot.marcasComErro(),
                snapshot.modelosInseridos(),
                snapshot.modelosIgnorados()
        );
    }

    private record FipeMarcaPayload(String nome, String codigo) {
    }

    private record MarcaImportResult(int inseridos, int ignorados) {
    }

    private record ImportStatusSnapshot(
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
}
