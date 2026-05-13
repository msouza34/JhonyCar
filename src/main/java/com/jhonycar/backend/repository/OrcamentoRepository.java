package com.jhonycar.backend.repository;

import com.jhonycar.backend.entity.Orcamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrcamentoRepository extends JpaRepository<Orcamento, Long> {
    List<Orcamento> findByClienteIdOrderByIdDesc(Long clienteId);

    List<Orcamento> findAllByOrderByIdDesc();

    boolean existsByClienteId(Long clienteId);

    Optional<Orcamento> findTopByOrderByIdDesc();
}

