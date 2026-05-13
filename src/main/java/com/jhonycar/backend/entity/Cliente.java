package com.jhonycar.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "clientes")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String cpfCnpj;

    @Column(nullable = false)
    private String telefone;

    @Column(nullable = false)
    private String email;

    @Column
    private Boolean ativo;

    @Column
    private LocalDate dataCadastro;

    @Column(length = 12)
    private String cep;

    @Column(length = 140)
    private String endereco;

    @Column(length = 30)
    private String numero;

    @Column(length = 80)
    private String bairro;

    @Column(length = 80)
    private String cidade;

    @Column(length = 2)
    private String uf;

    @Column(length = 120)
    private String complemento;

    @Column(length = 500)
    private String observacoes;

    @OneToMany(mappedBy = "cliente")
    @Builder.Default
    private List<Veiculo> veiculos = new ArrayList<>();

    @OneToMany(mappedBy = "cliente")
    @Builder.Default
    private List<OrdemServico> ordensServico = new ArrayList<>();

    @OneToMany(mappedBy = "cliente")
    @Builder.Default
    private List<Orcamento> orcamentos = new ArrayList<>();

    @OneToMany(mappedBy = "cliente")
    @Builder.Default
    private List<Financeiro> financeiros = new ArrayList<>();

    @OneToMany(mappedBy = "cliente")
    @Builder.Default
    private List<Agendamento> agendamentos = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (ativo == null) {
            ativo = Boolean.TRUE;
        }
        if (dataCadastro == null) {
            dataCadastro = LocalDate.now();
        }
    }
}
