package com.jhonycar.backend.integration.fipe;

import java.util.List;

public interface FipeClient {

    List<FipeVeiculoModelo> buscarModelosPorMarca(String marca);
}
