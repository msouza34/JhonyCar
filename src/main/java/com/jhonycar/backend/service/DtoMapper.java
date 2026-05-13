package com.jhonycar.backend.service;

import com.jhonycar.backend.dto.*;
import com.jhonycar.backend.entity.*;
import com.jhonycar.backend.entity.enums.OrcamentoItemTipo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DtoMapper {

    private final WhatsappService whatsappService;
    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public ClienteResponse toClienteResponse(Cliente cliente) {
        return new ClienteResponse(
                cliente.getId(),
                cliente.getNome(),
                cliente.getCpfCnpj(),
                cliente.getTelefone(),
                cliente.getEmail(),
                cliente.getAtivo(),
                cliente.getDataCadastro(),
                cliente.getCep(),
                cliente.getEndereco(),
                cliente.getNumero(),
                cliente.getBairro(),
                cliente.getCidade(),
                cliente.getUf(),
                cliente.getComplemento(),
                cliente.getObservacoes()
        );
    }

    public VeiculoResponse toVeiculoResponse(Veiculo veiculo) {
        return new VeiculoResponse(
                veiculo.getId(),
                veiculo.getPlaca(),
                veiculo.getModelo(),
                veiculo.getMarca(),
                veiculo.getAno(),
                veiculo.getCliente().getId(),
                veiculo.getCliente().getNome()
        );
    }

    public OrdemServicoResponse toOrdemServicoResponse(OrdemServico ordemServico) {
        return new OrdemServicoResponse(
                ordemServico.getId(),
                ordemServico.getCliente().getId(),
                ordemServico.getCliente().getNome(),
                ordemServico.getVeiculo().getId(),
                ordemServico.getVeiculo().getPlaca(),
                ordemServico.getProblemaRelatado(),
                ordemServico.getDiagnostico(),
                ordemServico.getValorTotal(),
                ordemServico.getStatus(),
                ordemServico.getDataEntrada(),
                ordemServico.getDataSaida(),
                Boolean.TRUE.equals(ordemServico.getArchived()),
                ordemServico.getUpdatedAt()
        );
    }

    public FinanceiroResponse toFinanceiroResponse(Financeiro financeiro) {
        Cliente cliente = financeiro.getCliente() != null
                ? financeiro.getCliente()
                : (financeiro.getOrdemServico() != null ? financeiro.getOrdemServico().getCliente() : null);
        Long ordemServicoId = financeiro.getOrdemServico() != null ? financeiro.getOrdemServico().getId() : null;
        String mensagem = ordemServicoId != null
                ? String.format("Ola %s, seu orcamento da OS #%d e R$ %s.", cliente != null ? cliente.getNome() : "cliente", ordemServicoId, financeiro.getValor())
                : String.format("Ola %s, seu lancamento financeiro e de R$ %s.", cliente != null ? cliente.getNome() : "cliente", financeiro.getValor());
        String link = cliente != null
                ? whatsappService.gerarLink(cliente.getTelefone(), mensagem)
                : "";

        return new FinanceiroResponse(
                financeiro.getId(),
                cliente != null ? cliente.getId() : null,
                ordemServicoId,
                financeiro.getNotaFiscal() != null ? financeiro.getNotaFiscal().getId() : null,
                financeiro.getValor(),
                financeiro.getTipo(),
                financeiro.getFormaPagamento(),
                financeiro.getStatus(),
                financeiro.getData(),
                link
        );
    }

    public OrcamentoResponse toOrcamentoResponse(Orcamento orcamento) {
        return new OrcamentoResponse(
                orcamento.getId(),
                orcamento.getNumero(),
                orcamento.getCliente().getId(),
                orcamento.getCliente().getNome(),
                orcamento.getCliente().getTelefone(),
                orcamento.getCliente().getEmail(),
                orcamento.getVeiculo() != null ? orcamento.getVeiculo().getId() : null,
                orcamento.getVeiculoModelo(),
                orcamento.getVeiculoAno(),
                orcamento.getVeiculoPlaca(),
                orcamento.getVeiculoChassi(),
                orcamento.getStatus(),
                orcamento.getCriadoEm(),
                orcamento.getValidadeEm(),
                orcamento.getVendedor(),
                orcamento.getFormaPagamento(),
                orcamento.getDesconto(),
                orcamento.getValorTotal(),
                orcamento.getItens().stream()
                        .filter(item -> item.getTipo() == OrcamentoItemTipo.SERVICO)
                        .map(this::toOrcamentoItemResponse)
                        .toList(),
                orcamento.getItens().stream()
                        .filter(item -> item.getTipo() == OrcamentoItemTipo.PECA)
                        .map(this::toOrcamentoItemResponse)
                        .toList(),
                orcamento.getConvertidoEmOs(),
                orcamento.getOsNumero(),
                orcamento.getAtualizadoEm()
        );
    }

    public OrcamentoItemResponse toOrcamentoItemResponse(OrcamentoItem item) {
        return new OrcamentoItemResponse(
                item.getId(),
                item.getDescricao(),
                item.getCodigo(),
                item.getQuantidade(),
                item.getValorUnitario(),
                item.getGarantia()
        );
    }

    public AgendamentoResponse toAgendamentoResponse(Agendamento agendamento) {
        return new AgendamentoResponse(
                agendamento.getId(),
                agendamento.getCliente().getId(),
                agendamento.getCliente().getNome(),
                agendamento.getVeiculo().getId(),
                agendamento.getVeiculo().getPlaca(),
                agendamento.getDataHora(),
                agendamento.getDescricao(),
                agendamento.getStatus()
        );
    }

    public NotaFiscalResponse toNotaFiscalResponse(NotaFiscalSimulada nota) {
        String linkPdf = baseUrl + "/notas/" + nota.getId() + "/pdf";
        String mensagem = String.format(
                "Ola %s, segue sua nota: %s",
                nota.getClienteNome(),
                linkPdf
        );
        String telefone = nota.getOrdemServico().getCliente().getTelefone();
        String link = whatsappService.gerarLink(telefone, mensagem);

        return new NotaFiscalResponse(
                nota.getId(),
                nota.getNumero(),
                nota.getClienteNome(),
                nota.getCpfCnpj(),
                nota.getDescricaoServico(),
                nota.getValor(),
                nota.getStatus(),
                nota.getDataEmissao(),
                nota.getMotivoCancelamento(),
                nota.getDataCancelamento(),
                nota.getOrdemServico().getId(),
                linkPdf,
                link
        );
    }
}
