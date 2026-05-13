package com.jhonycar.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "veiculos_modelos",
        indexes = {
                @Index(name = "idx_veiculos_modelos_marca", columnList = "marca"),
                @Index(name = "idx_veiculos_modelos_ativo", columnList = "ativo")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_veiculos_modelos_marca_modelo", columnNames = {"marca", "modelo"})
        }
)
public class VeiculoModelo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String marca;

    @Column(nullable = false, length = 120)
    private String modelo;

    @Column(name = "imagem_url", nullable = false, length = 1000)
    private String imagemUrl;

    @Column(nullable = false)
    private Boolean ativo;
}
