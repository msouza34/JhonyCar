package com.jhonycar.backend.repository;

import com.jhonycar.backend.entity.Agendamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {
    List<Agendamento> findByClienteId(Long clienteId);

    boolean existsByClienteId(Long clienteId);

    boolean existsByVeiculoId(Long veiculoId);
}
