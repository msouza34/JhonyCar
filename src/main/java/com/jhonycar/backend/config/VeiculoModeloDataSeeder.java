package com.jhonycar.backend.config;

import com.jhonycar.backend.entity.VeiculoModelo;
import com.jhonycar.backend.repository.VeiculoModeloRepository;
import com.jhonycar.backend.service.veiculos.VeiculoImagemStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class VeiculoModeloDataSeeder implements CommandLineRunner {

    private final VeiculoModeloRepository veiculoModeloRepository;
    private final VeiculoImagemStorageService veiculoImagemStorageService;

    @Override
    public void run(String... args) {
        if (veiculoModeloRepository.count() > 0) {
            return;
        }

        List<VeiculoModelo> seeds = new ArrayList<>();
        seeds.add(seed("Fiat", "Argo"));
        seeds.add(seed("Fiat", "Mobi"));
        seeds.add(seed("Chevrolet", "Onix"));
        seeds.add(seed("Chevrolet", "Tracker"));
        seeds.add(seed("Volkswagen", "Gol"));
        seeds.add(seed("Volkswagen", "T-Cross"));
        seeds.add(seed("Toyota", "Corolla"));
        seeds.add(seed("Toyota", "Yaris"));
        seeds.add(seed("Honda", "Civic"));
        seeds.add(seed("Honda", "HR-V"));
        seeds.add(seed("Hyundai", "HB20"));
        seeds.add(seed("Renault", "Kwid"));

        veiculoModeloRepository.saveAll(seeds);
    }

    private VeiculoModelo seed(String marca, String modelo) {
        return VeiculoModelo.builder()
                .marca(marca)
                .modelo(modelo)
                .imagemUrl(veiculoImagemStorageService.placeholderUrlFor(marca, modelo))
                .ativo(true)
                .build();
    }
}
