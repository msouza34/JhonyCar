package com.jhonycar.backend.entity;

import com.jhonycar.backend.entity.enums.OrdemServicoStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "ordens_servico")
public class OrdemServico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "veiculo_id", nullable = false)
    private Veiculo veiculo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String problemaRelatado;

    @Column(columnDefinition = "TEXT")
    private String diagnostico;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrdemServicoStatus status;

    @Column(nullable = false)
    private LocalDateTime dataEntrada;

    private LocalDateTime dataSaida;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    @Builder.Default
    private Boolean archived = false;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "ordemServico")
    @Builder.Default
    private List<Financeiro> financeiros = new ArrayList<>();

    @OneToOne(mappedBy = "ordemServico")
    private NotaFiscalSimulada notaFiscal;

    @PrePersist
    public void prePersist() {
        if (dataEntrada == null) {
            dataEntrada = LocalDateTime.now();
        }
        if (status == null) {
            status = OrdemServicoStatus.RECEBIDO;
        }
        if (valorTotal == null) {
            valorTotal = BigDecimal.ZERO;
        }
        if (archived == null) {
            archived = false;
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
        if (archived == null) {
            archived = false;
        }
    }
}
