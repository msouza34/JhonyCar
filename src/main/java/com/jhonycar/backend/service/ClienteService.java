package com.jhonycar.backend.service;

import com.jhonycar.backend.dto.*;
import com.jhonycar.backend.entity.Cliente;
import com.jhonycar.backend.exception.BadRequestException;
import com.jhonycar.backend.exception.ResourceNotFoundException;
import com.jhonycar.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final VeiculoRepository veiculoRepository;
    private final OrdemServicoRepository ordemServicoRepository;
    private final OrcamentoRepository orcamentoRepository;
    private final FinanceiroRepository financeiroRepository;
    private final NotaFiscalSimuladaRepository notaFiscalSimuladaRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final DtoMapper mapper;

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public ClienteResponse create(ClienteRequest request) {
        if (clienteRepository.existsByCpfCnpj(request.cpfCnpj())) {
            throw new BadRequestException("Ja existe cliente com esse CPF/CNPJ");
        }

        Cliente cliente = Cliente.builder()
                .nome(request.nome())
                .cpfCnpj(request.cpfCnpj())
                .telefone(request.telefone())
                .email(request.email())
                .ativo(request.ativo())
                .dataCadastro(request.dataCadastro())
                .cep(normalizarTexto(request.cep()))
                .endereco(normalizarTexto(request.endereco()))
                .numero(normalizarTexto(request.numero()))
                .bairro(normalizarTexto(request.bairro()))
                .cidade(normalizarTexto(request.cidade()))
                .uf(normalizarUf(request.uf()))
                .complemento(normalizarTexto(request.complemento()))
                .observacoes(normalizarTexto(request.observacoes()))
                .build();

        return mapper.toClienteResponse(clienteRepository.save(cliente));
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public ClienteResponse update(Long id, ClienteRequest request) {
        Cliente cliente = findEntityById(id);

        if (!cliente.getCpfCnpj().equals(request.cpfCnpj()) && clienteRepository.existsByCpfCnpj(request.cpfCnpj())) {
            throw new BadRequestException("Ja existe cliente com esse CPF/CNPJ");
        }

        cliente.setNome(request.nome());
        cliente.setCpfCnpj(request.cpfCnpj());
        cliente.setTelefone(request.telefone());
        cliente.setEmail(request.email());
        if (request.ativo() != null) {
            cliente.setAtivo(request.ativo());
        }
        if (request.dataCadastro() != null) {
            cliente.setDataCadastro(request.dataCadastro());
        }
        cliente.setCep(normalizarTexto(request.cep()));
        cliente.setEndereco(normalizarTexto(request.endereco()));
        cliente.setNumero(normalizarTexto(request.numero()));
        cliente.setBairro(normalizarTexto(request.bairro()));
        cliente.setCidade(normalizarTexto(request.cidade()));
        cliente.setUf(normalizarUf(request.uf()));
        cliente.setComplemento(normalizarTexto(request.complemento()));
        cliente.setObservacoes(normalizarTexto(request.observacoes()));

        return mapper.toClienteResponse(clienteRepository.save(cliente));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "clientes", key = "#id")
    public ClienteResponse getById(Long id) {
        return mapper.toClienteResponse(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public Page<ClienteResponse> list(Pageable pageable) {
        return clienteRepository.findAll(pageable).map(mapper::toClienteResponse);
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral", "clientes"}, allEntries = true)
    public void delete(Long id) {
        Cliente cliente = findEntityById(id);

        if (veiculoRepository.existsByClienteId(id)) {
            throw new BadRequestException("Nao e possivel excluir: o cliente possui veiculos vinculados");
        }

        if (ordemServicoRepository.existsByClienteId(id)) {
            throw new BadRequestException("Nao e possivel excluir: o cliente possui ordens de servico vinculadas");
        }

        if (orcamentoRepository.existsByClienteId(id)) {
            throw new BadRequestException("Nao e possivel excluir: o cliente possui orcamentos vinculados");
        }

        if (financeiroRepository.existsByClienteId(id) || financeiroRepository.existsByOrdemServicoClienteId(id)) {
            throw new BadRequestException("Nao e possivel excluir: o cliente possui lancamentos financeiros vinculados");
        }

        if (agendamentoRepository.existsByClienteId(id)) {
            throw new BadRequestException("Nao e possivel excluir: o cliente possui agendamentos vinculados");
        }

        clienteRepository.delete(cliente);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "clienteCentral", key = "#id")
    public ClienteCentralResponse getCentral(Long id) {
        Cliente cliente = findEntityById(id);

        List<VeiculoResponse> veiculos = veiculoRepository.findByClienteId(id).stream()
                .map(mapper::toVeiculoResponse)
                .toList();

        List<OrdemServicoResponse> ordens = ordemServicoRepository.findAllByClienteId(id).stream()
                .map(mapper::toOrdemServicoResponse)
                .toList();

        List<OrcamentoResponse> orcamentos = orcamentoRepository.findByClienteIdOrderByIdDesc(id).stream()
                .map(mapper::toOrcamentoResponse)
                .toList();

        List<FinanceiroResponse> financeiros = listarFinanceirosDoCliente(id).stream()
                .map(mapper::toFinanceiroResponse)
                .toList();

        List<NotaFiscalResponse> notas = notaFiscalSimuladaRepository.findByOrdemServicoClienteId(id).stream()
                .map(mapper::toNotaFiscalResponse)
                .toList();

        List<AgendamentoResponse> agendamentos = agendamentoRepository.findByClienteId(id).stream()
                .map(mapper::toAgendamentoResponse)
                .toList();

        return new ClienteCentralResponse(
                mapper.toClienteResponse(cliente),
                veiculos,
                ordens,
                orcamentos,
                financeiros,
                notas,
                agendamentos
        );
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "clienteCentral", key = "'detalhes:' + #id")
    public ClienteDetalhesResponse getDetalhes(Long id) {
        Cliente cliente = findEntityById(id);

        List<VeiculoResponse> veiculos = veiculoRepository.findByClienteId(id).stream()
                .map(mapper::toVeiculoResponse)
                .toList();

        List<OrdemServicoResponse> ordens = ordemServicoRepository.findAllByClienteId(id).stream()
                .map(mapper::toOrdemServicoResponse)
                .toList();

        List<OrcamentoResponse> orcamentos = orcamentoRepository.findByClienteIdOrderByIdDesc(id).stream()
                .map(mapper::toOrcamentoResponse)
                .toList();

        List<FinanceiroResponse> financeiros = listarFinanceirosDoCliente(id).stream()
                .map(mapper::toFinanceiroResponse)
                .toList();

        return new ClienteDetalhesResponse(
                mapper.toClienteResponse(cliente),
                veiculos,
                ordens,
                orcamentos,
                financeiros
        );
    }

    @Transactional(readOnly = true)
    public Cliente findEntityById(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente nao encontrado com id " + id));
    }

    private List<com.jhonycar.backend.entity.Financeiro> listarFinanceirosDoCliente(Long clienteId) {
        List<com.jhonycar.backend.entity.Financeiro> result = new ArrayList<>(financeiroRepository.findByClienteIdOrderByIdDesc(clienteId));
        Set<Long> ids = new HashSet<>(result.stream().map(com.jhonycar.backend.entity.Financeiro::getId).toList());
        for (com.jhonycar.backend.entity.Financeiro item : financeiroRepository.findByOrdemServicoClienteId(clienteId)) {
            if (!ids.contains(item.getId())) {
                result.add(item);
                ids.add(item.getId());
            }
        }
        result.sort(Comparator.comparing(com.jhonycar.backend.entity.Financeiro::getId).reversed());
        return result;
    }

    private String normalizarTexto(String valor) {
        if (valor == null) return null;
        String trimmed = valor.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String normalizarUf(String uf) {
        String valor = normalizarTexto(uf);
        return valor == null ? null : valor.toUpperCase();
    }
}
