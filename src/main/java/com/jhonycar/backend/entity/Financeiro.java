package com.jhonycar.backend.entity;

import com.jhonycar.backend.entity.enums.FinanceiroTipo;
import com.jhonycar.backend.entity.enums.FinanceiroStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "financeiros")
public class Financeiro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ordem_servico_id")
    private OrdemServico ordemServico;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nota_fiscal_id", unique = true)
    private NotaFiscalSimulada notaFiscal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FinanceiroTipo tipo;

    @Column(nullable = false)
    private String formaPagamento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FinanceiroStatus status;

    @Column(nullable = false)
    private LocalDate data;

    @PrePersist
    public void prePersist() {
        if (data == null) {
            data = LocalDate.now();
        }
        if (tipo == null) {
            tipo = FinanceiroTipo.SERVICO;
        }
        if (status == null) {
            status = FinanceiroStatus.PENDENTE;
        }
    }
}
