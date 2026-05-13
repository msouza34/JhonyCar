package com.jhonycar.backend.service.veiculos;

import com.jhonycar.backend.dto.VeiculoImagemUploadResponse;
import com.jhonycar.backend.dto.VeiculoModeloCadastroRequest;
import com.jhonycar.backend.dto.VeiculoModeloOptionResponse;
import com.jhonycar.backend.entity.VeiculoModelo;
import com.jhonycar.backend.exception.ResourceNotFoundException;
import com.jhonycar.backend.integration.fipe.FipeClient;
import com.jhonycar.backend.integration.fipe.FipeVeiculoModelo;
import com.jhonycar.backend.repository.VeiculoModeloRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VeiculoModeloService {

    private final VeiculoModeloRepository veiculoModeloRepository;
    private final FipeClient fipeClient;
    private final VeiculoImagemStorageService imagemStorageService;

    @Value("${app.veiculos.cache-ttl-seconds:300}")
    private long cacheTtlSeconds;

    // Cache separado por tenant para facilitar evolucao futura para isolamento multi-tenant.
    private final Map<String, CacheEntry<List<String>>> marcasCache = new ConcurrentHashMap<>();
    private final Map<String, CacheEntry<List<VeiculoModeloOptionResponse>>> modelosCache = new ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public List<String> listarMarcas(String tenantId) {
        String tenantKey = normalizeTenant(tenantId);

        CacheEntry<List<String>> cached = marcasCache.get(tenantKey);
        if (isCacheValido(cached)) {
            return cached.value();
        }

        List<String> marcasOrdenadas = deduplicarMarcasOrdenadas(veiculoModeloRepository.findDistinctMarcas());
        List<String> marcasImutaveis = List.copyOf(marcasOrdenadas);

        marcasCache.put(tenantKey, new CacheEntry<>(marcasImutaveis, nextExpiry()));
        return marcasImutaveis;
    }

    @Transactional(readOnly = true)
    public List<VeiculoModeloOptionResponse> listarModelosPorMarca(String tenantId, String marca) {
        String tenantKey = normalizeTenant(tenantId);
        String marcaSanitizada = sanitizeRequired(marca, "Marca e obrigatoria");
        String cacheKey = tenantKey + "::" + marcaSanitizada.toLowerCase(Locale.ROOT);

        CacheEntry<List<VeiculoModeloOptionResponse>> cached = modelosCache.get(cacheKey);
        if (isCacheValido(cached)) {
            return cached.value();
        }

        List<VeiculoModelo> modelos = veiculoModeloRepository.findByMarcaOrderByModeloAsc(marcaSanitizada);

        if (modelos.isEmpty()) {
            log.info("Catalogo sem modelos para marca '{}'. Tentando hidratacao via FIPE", marcaSanitizada);
            hidratarCatalogoDaFipe(marcaSanitizada);
            modelos = veiculoModeloRepository.findByMarcaOrderByModeloAsc(marcaSanitizada);
        }

        List<VeiculoModeloOptionResponse> resposta = deduplicarModelosOrdenados(modelos);
        List<VeiculoModeloOptionResponse> imutavel = List.copyOf(resposta);

        modelosCache.put(cacheKey, new CacheEntry<>(imutavel, nextExpiry()));
        return imutavel;
    }

    @Transactional
    public VeiculoModeloOptionResponse cadastrarOuAtualizar(String tenantId, VeiculoModeloCadastroRequest request) {
        String tenantKey = normalizeTenant(tenantId);
        String marca = sanitizeRequired(request.marca(), "Marca e obrigatoria");
        String modelo = sanitizeRequired(request.modelo(), "Modelo e obrigatorio");

        Optional<VeiculoModelo> existente = veiculoModeloRepository.findByMarcaIgnoreCaseAndModeloIgnoreCase(marca, modelo);

        VeiculoModelo entity = existente.orElseGet(() -> VeiculoModelo.builder().build());
        entity.setMarca(marca);
        entity.setModelo(modelo);
        entity.setAtivo(request.ativo() == null || request.ativo());
        entity.setImagemUrl(normalizeImagemUrlOuPlaceholder(request.imagemUrl(), marca, modelo));

        VeiculoModelo salvo = veiculoModeloRepository.save(entity);

        invalidarCache(tenantKey, marca);
        return toResponse(salvo);
    }

    @Transactional
    public VeiculoImagemUploadResponse uploadImagem(String tenantId, Long modeloId, MultipartFile arquivo) {
        String tenantKey = normalizeTenant(tenantId);
        VeiculoModelo modelo = veiculoModeloRepository.findById(modeloId)
                .orElseThrow(() -> new ResourceNotFoundException("Modelo de veiculo nao encontrado com id " + modeloId));

        String imagemUrl = imagemStorageService.salvarImagem(arquivo);
        modelo.setImagemUrl(imagemUrl);
        veiculoModeloRepository.save(modelo);

        invalidarCache(tenantKey, modelo.getMarca());
        return new VeiculoImagemUploadResponse(modelo.getId(), imagemUrl);
    }

    @Transactional(readOnly = true)
    public boolean existeModeloAtivo(String tenantId, String marca, String modelo) {
        String marcaSanitizada = sanitizeRequired(marca, "Marca e obrigatoria");
        String modeloSanitizado = sanitizeRequired(modelo, "Modelo e obrigatorio");
        return veiculoModeloRepository.existsByAtivoTrueAndMarcaIgnoreCaseAndModeloIgnoreCase(marcaSanitizada, modeloSanitizado);
    }

    @Transactional
    public void garantirModeloCadastrado(String tenantId, String marca, String modelo) {
        String tenantKey = normalizeTenant(tenantId);
        String marcaSanitizada = sanitizeRequired(marca, "Marca e obrigatoria");
        String modeloSanitizado = sanitizeRequired(modelo, "Modelo e obrigatorio");

        if (veiculoModeloRepository.existsByAtivoTrueAndMarcaIgnoreCaseAndModeloIgnoreCase(marcaSanitizada, modeloSanitizado)) {
            return;
        }

        listarModelosPorMarca(tenantKey, marcaSanitizada);

        if (veiculoModeloRepository.existsByAtivoTrueAndMarcaIgnoreCaseAndModeloIgnoreCase(marcaSanitizada, modeloSanitizado)) {
            return;
        }

        VeiculoModelo novoModelo = VeiculoModelo.builder()
                .marca(marcaSanitizada)
                .modelo(modeloSanitizado)
                .imagemUrl(imagemStorageService.placeholderUrlFor(marcaSanitizada, modeloSanitizado))
                .ativo(true)
                .build();

        veiculoModeloRepository.save(novoModelo);
        invalidarCache(tenantKey, marcaSanitizada);
    }

    @Transactional(readOnly = true)
    public String buscarImagemPorMarcaModelo(String tenantId, String marca, String modelo) {
        String marcaSanitizada = sanitizeRequired(marca, "Marca e obrigatoria");
        String modeloSanitizado = sanitizeRequired(modelo, "Modelo e obrigatorio");

        return veiculoModeloRepository
                .findByAtivoTrueAndMarcaIgnoreCaseAndModeloIgnoreCase(marcaSanitizada, modeloSanitizado)
                .map(item -> resolveImagemUrl(item.getImagemUrl(), item.getMarca(), item.getModelo()))
                .orElseGet(() -> imagemStorageService.placeholderUrlFor(marcaSanitizada, modeloSanitizado));
    }

    public void invalidarCacheCatalogo(String tenantId) {
        String tenantKey = normalizeTenant(tenantId);
        invalidarCache(tenantKey, null);
    }

    private void hidratarCatalogoDaFipe(String marca) {
        List<FipeVeiculoModelo> externos = fipeClient.buscarModelosPorMarca(marca);
        if (externos.isEmpty()) {
            return;
        }

        List<VeiculoModelo> existentes = veiculoModeloRepository.findByMarcaOrderByModeloAsc(marca);
        Set<String> modelosExistentes = existentes.stream()
                .map(VeiculoModelo::getModelo)
                .map(this::normalizeKey)
                .collect(Collectors.toSet());

        List<VeiculoModelo> novos = new ArrayList<>();

        for (FipeVeiculoModelo externo : externos) {
            String modelo = sanitizeOptional(externo.modelo());
            if (modelo.isBlank()) {
                continue;
            }

            String modeloKey = normalizeKey(modelo);
            if (modelosExistentes.contains(modeloKey)) {
                continue;
            }

            String marcaPersistida = sanitizeOptional(externo.marca()).isBlank() ? marca : sanitizeOptional(externo.marca());

            VeiculoModelo novo = VeiculoModelo.builder()
                    .marca(marcaPersistida)
                    .modelo(modelo)
                    .imagemUrl(normalizeImagemUrlOuPlaceholder(externo.imagemUrl(), marcaPersistida, modelo))
                    .ativo(true)
                    .build();

            novos.add(novo);
            modelosExistentes.add(modeloKey);
        }

        if (!novos.isEmpty()) {
            veiculoModeloRepository.saveAll(novos);
        }
    }

    private List<String> deduplicarMarcasOrdenadas(List<String> marcas) {
        TreeSet<String> ordenado = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);

        for (String marca : marcas) {
            String sanitizada = sanitizeOptional(marca);
            if (!sanitizada.isBlank()) {
                ordenado.add(sanitizada);
            }
        }

        return new ArrayList<>(ordenado);
    }

    private List<VeiculoModeloOptionResponse> deduplicarModelosOrdenados(List<VeiculoModelo> modelos) {
        Map<String, VeiculoModeloOptionResponse> unique = new LinkedHashMap<>();

        for (VeiculoModelo item : modelos) {
            String marca = sanitizeOptional(item.getMarca());
            String modelo = sanitizeOptional(item.getModelo());
            if (marca.isBlank() || modelo.isBlank()) {
                continue;
            }

            String key = normalizeKey(modelo);
            unique.putIfAbsent(key, new VeiculoModeloOptionResponse(
                    item.getId(),
                    marca,
                    modelo,
                    resolveImagemUrl(item.getImagemUrl(), marca, modelo)
            ));
        }

        return List.copyOf(unique.values());
    }

    private VeiculoModeloOptionResponse toResponse(VeiculoModelo item) {
        String marca = sanitizeOptional(item.getMarca());
        String modelo = sanitizeOptional(item.getModelo());
        return new VeiculoModeloOptionResponse(
                item.getId(),
                marca,
                modelo,
                resolveImagemUrl(item.getImagemUrl(), marca, modelo)
        );
    }

    private String resolveImagemUrl(String imagemUrl, String marca, String modelo) {
        String sanitizada = sanitizeOptional(imagemUrl);
        if (!sanitizada.isBlank()) {
            return sanitizada;
        }
        return imagemStorageService.placeholderUrlFor(marca, modelo);
    }

    private String normalizeImagemUrlOuPlaceholder(String imagemUrl, String marca, String modelo) {
        String sanitizada = sanitizeOptional(imagemUrl);
        if (sanitizada.isBlank()) {
            return imagemStorageService.placeholderUrlFor(marca, modelo);
        }
        return sanitizada;
    }

    private void invalidarCache(String tenantKey, String marca) {
        marcasCache.remove(tenantKey);

        if (marca == null || marca.isBlank()) {
            modelosCache.keySet().removeIf(key -> key.startsWith(tenantKey + "::"));
            return;
        }

        String key = tenantKey + "::" + sanitizeOptional(marca).toLowerCase(Locale.ROOT);
        modelosCache.remove(key);
    }

    private String normalizeTenant(String tenantId) {
        String tenant = sanitizeOptional(tenantId);
        return tenant.isBlank() ? "default" : tenant.toLowerCase(Locale.ROOT);
    }

    private String sanitizeRequired(String value, String mensagem) {
        String sanitized = sanitizeOptional(value);
        if (sanitized.isBlank()) {
            throw new IllegalArgumentException(mensagem);
        }
        return sanitized;
    }

    private String sanitizeOptional(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\s+", " ").trim();
    }

    private String normalizeKey(String value) {
        return sanitizeOptional(value).toLowerCase(Locale.ROOT);
    }

    private boolean isCacheValido(CacheEntry<?> entry) {
        return entry != null && Instant.now().isBefore(entry.expiresAt());
    }

    private Instant nextExpiry() {
        long seconds = Math.max(30, cacheTtlSeconds);
        return Instant.now().plusSeconds(seconds);
    }

    private record CacheEntry<T>(T value, Instant expiresAt) {
    }
}
