package com.jhonycar.backend.integration.fipe;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.fipe", name = "enabled", havingValue = "true")
public class HttpFipeClient implements FipeClient {

    private final ObjectMapper objectMapper;

    @Value("${app.fipe.base-url:https://parallelum.com.br/fipe/api/v1}")
    private String baseUrl;

    private RestClient restClient;

    @PostConstruct
    void init() {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    @Override
    public List<FipeVeiculoModelo> buscarModelosPorMarca(String marca) {
        String marcaNormalizada = normalize(marca);
        if (marcaNormalizada.isBlank()) {
            return List.of();
        }

        try {
            String marcasPayload = restClient.get()
                    .uri("/carros/marcas")
                    .retrieve()
                    .body(String.class);

            String codigoMarca = findCodigoMarcaByNome(marcaNormalizada, marcasPayload);
            if (codigoMarca == null) {
                return List.of();
            }

            String modelosPayload = restClient.get()
                    .uri("/carros/marcas/{codigo}/modelos", codigoMarca)
                    .retrieve()
                    .body(String.class);

            return parseModelos(marca, modelosPayload);
        } catch (Exception ex) {
            log.warn("Falha ao consultar FIPE para marca '{}': {}", marca, ex.getMessage());
            return List.of();
        }
    }

    private String findCodigoMarcaByNome(String marcaNormalizada, String payload) throws Exception {
        if (payload == null || payload.isBlank()) {
            return null;
        }

        List<Map<String, Object>> marcas = objectMapper.readValue(payload, new TypeReference<>() {
        });

        for (Map<String, Object> marca : marcas) {
            String nome = String.valueOf(marca.getOrDefault("nome", ""));
            if (normalize(nome).equals(marcaNormalizada)) {
                return String.valueOf(marca.getOrDefault("codigo", ""));
            }
        }

        return null;
    }

    private List<FipeVeiculoModelo> parseModelos(String marca, String payload) throws Exception {
        if (payload == null || payload.isBlank()) {
            return List.of();
        }

        Map<String, Object> root = objectMapper.readValue(payload, new TypeReference<>() {
        });
        Object modelosRaw = root.get("modelos");

        if (!(modelosRaw instanceof List<?> modelos)) {
            return List.of();
        }

        List<FipeVeiculoModelo> resultado = new ArrayList<>();

        for (Object entry : modelos) {
            if (!(entry instanceof Map<?, ?> modeloMap)) {
                continue;
            }
            Object nomeRaw = modeloMap.get("nome");
            String nomeModelo = nomeRaw == null ? "" : String.valueOf(nomeRaw);
            if (nomeModelo.isBlank()) {
                continue;
            }
            resultado.add(new FipeVeiculoModelo(marca, nomeModelo, null));
        }

        return resultado;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }

        String semAcento = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");

        return semAcento
                .replaceAll("\\s+", " ")
                .trim()
                .toLowerCase(Locale.ROOT);
    }
}
