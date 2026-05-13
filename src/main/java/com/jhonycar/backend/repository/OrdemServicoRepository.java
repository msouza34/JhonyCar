package com.jhonycar.backend.repository;

import com.jhonycar.backend.entity.OrdemServico;
import com.jhonycar.backend.entity.enums.OrdemServicoStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {
    List<OrdemServico> findByClienteId(Long clienteId);

    boolean existsByClienteId(Long clienteId);

    boolean existsByVeiculoId(Long veiculoId);

    long countByStatusNot(OrdemServicoStatus status);

    long countByArchivedFalseAndStatusNot(OrdemServicoStatus status);

    Page<OrdemServico> findByArchived(boolean archived, Pageable pageable);

    @Query("SELECT os.status, COUNT(os) FROM OrdemServico os GROUP BY os.status")
    List<Object[]> countGroupByStatus();

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            UPDATE OrdemServico os
            SET os.archived = true
            WHERE os.archived = false
              AND os.status = :status
              AND (
                  (os.updatedAt IS NOT NULL AND os.updatedAt < :inicioDoDia)
                  OR (os.updatedAt IS NULL AND os.dataSaida IS NOT NULL AND os.dataSaida < :inicioDoDia)
                  OR (os.updatedAt IS NULL AND os.dataSaida IS NULL AND os.dataEntrada < :inicioDoDia)
              )
            """)
    int archiveFinalizadasAntesDoInicioDoDia(@Param("status") OrdemServicoStatus status,
                                             @Param("inicioDoDia") LocalDateTime inicioDoDia);

    @Query("SELECT os FROM OrdemServico os WHERE os.cliente.id = :clienteId")
    List<OrdemServico> findAllByClienteId(@Param("clienteId") Long clienteId);
}
