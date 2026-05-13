package com.jhonycar.backend.repository;

import com.jhonycar.backend.entity.Veiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VeiculoRepository extends JpaRepository<Veiculo, Long> {
    Optional<Veiculo> findByPlaca(String placa);

    boolean existsByPlaca(String placa);

    boolean existsByClienteId(Long clienteId);

    List<Veiculo> findByClienteId(Long clienteId);
}
