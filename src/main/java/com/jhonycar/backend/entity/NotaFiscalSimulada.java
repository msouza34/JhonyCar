package com.jhonycar.backend.entity;

import com.jhonycar.backend.entity.enums.NotaFiscalStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "notas_fiscais_simuladas")
public class NotaFiscalSimulada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String numero;

    @Column(nullable = false)
    private String clienteNome;

    @Column(nullable = false)
    private String cpfCnpj;

    @Column(nullable = false)
    private String descricaoServico;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotaFiscalStatus status;

    @Column(nullable = false)
    private LocalDateTime dataEmissao;

    @Column(columnDefinition = "TEXT")
    private String motivoCancelamento;

    private LocalDateTime dataCancelamento;

    @Column(nullable = false)
    private String pdfPath;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ordem_servico_id", nullable = false, unique = true)
    private OrdemServico ordemServico;

    @PrePersist
    public void prePersist() {
        if (status == null) {
            status = NotaFiscalStatus.SIMULADA;
        }
        if (dataEmissao == null) {
            dataEmissao = LocalDateTime.now();
        }
    }
}
