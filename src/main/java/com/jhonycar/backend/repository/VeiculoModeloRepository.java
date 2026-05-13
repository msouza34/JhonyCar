package com.jhonycar.backend.repository;

import com.jhonycar.backend.entity.VeiculoModelo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VeiculoModeloRepository extends JpaRepository<VeiculoModelo, Long> {

    @Query("""
            select distinct vm.marca
            from VeiculoModelo vm
            where vm.ativo = true
            """)
    List<String> findDistinctMarcas();

    default List<String> findDistinctMarcasAtivasOrdenadas() {
        return findDistinctMarcas();
    }

    @Query("""
            select vm
            from VeiculoModelo vm
            where vm.ativo = true
              and lower(vm.marca) = lower(:marca)
            order by lower(vm.modelo)
            """)
    List<VeiculoModelo> findByMarcaOrderByModeloAsc(@Param("marca") String marca);

    List<VeiculoModelo> findByAtivoTrueAndMarcaIgnoreCaseOrderByModeloAsc(String marca);

    Optional<VeiculoModelo> findByMarcaIgnoreCaseAndModeloIgnoreCase(String marca, String modelo);

    Optional<VeiculoModelo> findByAtivoTrueAndMarcaIgnoreCaseAndModeloIgnoreCase(String marca, String modelo);

    boolean existsByMarcaIgnoreCaseAndModeloIgnoreCase(String marca, String modelo);

    default boolean existsByMarcaAndModelo(String marca, String modelo) {
        return existsByMarcaIgnoreCaseAndModeloIgnoreCase(marca, modelo);
    }

    boolean existsByAtivoTrueAndMarcaIgnoreCaseAndModeloIgnoreCase(String marca, String modelo);
}
