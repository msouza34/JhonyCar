package com.jhonycar.backend.repository;

import com.jhonycar.backend.entity.NotaFiscalSimulada;
import com.jhonycar.backend.entity.enums.NotaFiscalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotaFiscalSimuladaRepository extends JpaRepository<NotaFiscalSimulada, Long> {
    List<NotaFiscalSimulada> findByOrdemServicoClienteId(Long clienteId);

    boolean existsByOrdemServicoId(Long ordemServicoId);

    long countBy();

    long countByStatus(NotaFiscalStatus status);
}
