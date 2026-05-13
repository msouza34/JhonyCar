package com.jhonycar.backend.dto;

import java.time.LocalDate;

public record ClienteResponse(
        Long id,
        String nome,
        String cpfCnpj,
        String telefone,
        String email,
        Boolean ativo,
        LocalDate dataCadastro,
        String cep,
        String endereco,
        String numero,
        String bairro,
        String cidade,
        String uf,
        String complemento,
        String observacoes
) {
}
