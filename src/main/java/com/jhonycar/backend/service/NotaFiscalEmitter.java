package com.jhonycar.backend.service;

import com.jhonycar.backend.entity.NotaFiscalSimulada;
import com.jhonycar.backend.entity.OrdemServico;

public interface NotaFiscalEmitter {
    NotaFiscalSimulada emitir(OrdemServico ordemServico);
}
