package com.jhonycar.backend.dto;

import java.util.List;

public record ClienteDetalhesResponse(
        ClienteResponse cliente,
        List<VeiculoResponse> veiculos,
        List<OrdemServicoResponse> ordensServico,
        List<OrcamentoResponse> orcamentos,
        List<FinanceiroResponse> financeiro
) {
}

