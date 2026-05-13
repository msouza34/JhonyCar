package com.jhonycar.backend.repository;

import com.jhonycar.backend.entity.Financeiro;
import com.jhonycar.backend.entity.enums.FinanceiroStatus;
import com.jhonycar.backend.entity.enums.FinanceiroTipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FinanceiroRepository extends JpaRepository<Financeiro, Long> {
    List<Financeiro> findByClienteIdOrderByIdDesc(Long clienteId);

    List<Financeiro> findByOrdemServicoClienteId(Long clienteId);

    Optional<Financeiro> findTopByOrdemServicoIdOrderByIdDesc(Long ordemServicoId);

    Optional<Financeiro> findTopByOrdemServicoIdAndTipoOrderByIdDesc(Long ordemServicoId, FinanceiroTipo tipo);

    Optional<Financeiro> findByNotaFiscalId(Long notaFiscalId);

    boolean existsByClienteId(Long clienteId);

    boolean existsByOrdemServicoClienteId(Long clienteId);

    @Query("SELECT COALESCE(SUM(f.valor), 0) FROM Financeiro f WHERE f.status = :status AND f.data BETWEEN :inicio AND :fim")
    BigDecimal sumByStatusAndDataBetween(@Param("status") FinanceiroStatus status,
                                         @Param("inicio") LocalDate inicio,
                                         @Param("fim") LocalDate fim);
}
