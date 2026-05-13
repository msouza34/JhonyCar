package com.jhonycar.backend.entity;

import com.jhonycar.backend.entity.enums.OrcamentoStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "orcamentos")
public class Orcamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String numero;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "veiculo_id")
    private Veiculo veiculo;

    @Column(nullable = false, length = 120)
    private String veiculoModelo;

    @Column(nullable = false)
    private Integer veiculoAno;

    @Column(nullable = false, length = 20)
    private String veiculoPlaca;

    @Column(length = 40)
    private String veiculoChassi;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrcamentoStatus status;

    @Column(nullable = false)
    private LocalDate validadeEm;

    @Column(nullable = false, length = 80)
    private String vendedor;

    @Column(nullable = false, length = 80)
    private String formaPagamento;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal desconto;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotal;

    @Column(nullable = false)
    private Boolean convertidoEmOs;

    @Column(length = 40)
    private String osNumero;

    @Column(nullable = false)
    private LocalDateTime criadoEm;

    @Column(nullable = false)
    private LocalDateTime atualizadoEm;

    @OneToMany(mappedBy = "orcamento", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrcamentoItem> itens = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        LocalDateTime agora = LocalDateTime.now();
        if (criadoEm == null) {
            criadoEm = agora;
        }
        if (atualizadoEm == null) {
            atualizadoEm = agora;
        }
        if (status == null) {
            status = OrcamentoStatus.PENDENTE;
        }
        if (desconto == null) {
            desconto = BigDecimal.ZERO;
        }
        if (valorTotal == null) {
            valorTotal = BigDecimal.ZERO;
        }
        if (convertidoEmOs == null) {
            convertidoEmOs = Boolean.FALSE;
        }
    }

    @PreUpdate
    public void preUpdate() {
        atualizadoEm = LocalDateTime.now();
    }
}

