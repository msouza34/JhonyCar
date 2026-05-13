package com.jhonycar.backend.integration.fipe;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@ConditionalOnProperty(prefix = "app.fipe", name = "enabled", havingValue = "false", matchIfMissing = true)
public class DisabledFipeClient implements FipeClient {

    @Override
    public List<FipeVeiculoModelo> buscarModelosPorMarca(String marca) {
        return List.of();
    }
}
