package com.jhonycar.backend.service;

import com.jhonycar.backend.dto.FinanceiroRequest;
import com.jhonycar.backend.dto.FinanceiroResponse;
import com.jhonycar.backend.entity.Cliente;
import com.jhonycar.backend.entity.Financeiro;
import com.jhonycar.backend.entity.NotaFiscalSimulada;
import com.jhonycar.backend.entity.OrdemServico;
import com.jhonycar.backend.entity.enums.FinanceiroStatus;
import com.jhonycar.backend.entity.enums.FinanceiroTipo;
import com.jhonycar.backend.exception.BadRequestException;
import com.jhonycar.backend.exception.ResourceNotFoundException;
import com.jhonycar.backend.repository.FinanceiroRepository;
import com.jhonycar.backend.repository.OrdemServicoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class FinanceiroService {

    private final FinanceiroRepository financeiroRepository;
    private final OrdemServicoRepository ordemServicoRepository;
    private final ClienteService clienteService;
    private final DtoMapper mapper;

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public FinanceiroResponse create(FinanceiroRequest request) {
        Cliente cliente = clienteService.findEntityById(request.clienteId());
        OrdemServico ordemServico = request.ordemServicoId() == null ? null : findOrdemById(request.ordemServicoId());
        validarRelacionamento(cliente, ordemServico);

        Financeiro financeiro = Financeiro.builder()
                .cliente(cliente)
                .ordemServico(ordemServico)
                .valor(request.valor())
                .tipo(request.tipo() == null ? FinanceiroTipo.SERVICO : request.tipo())
                .formaPagamento(request.formaPagamento())
                .status(request.status())
                .data(request.data() == null ? LocalDate.now() : request.data())
                .build();

        return mapper.toFinanceiroResponse(financeiroRepository.save(financeiro));
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public FinanceiroResponse update(Long id, FinanceiroRequest request) {
        Financeiro financeiro = findEntityById(id);
        Cliente cliente = clienteService.findEntityById(request.clienteId());
        OrdemServico ordemServico = request.ordemServicoId() == null ? null : findOrdemById(request.ordemServicoId());
        validarRelacionamento(cliente, ordemServico);

        financeiro.setCliente(cliente);
        financeiro.setOrdemServico(ordemServico);
        financeiro.setValor(request.valor());
        if (request.tipo() != null) {
            financeiro.setTipo(request.tipo());
        }
        financeiro.setFormaPagamento(request.formaPagamento());
        if (request.status() != null) {
            financeiro.setStatus(request.status());
        }
        financeiro.setData(request.data() == null ? financeiro.getData() : request.data());

        return mapper.toFinanceiroResponse(financeiroRepository.save(financeiro));
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public Financeiro createAutomaticoParaOrdemFinalizada(OrdemServico ordemServico) {
        return financeiroRepository.findTopByOrdemServicoIdAndTipoOrderByIdDesc(ordemServico.getId(), FinanceiroTipo.SERVICO)
                .orElseGet(() -> financeiroRepository.save(Financeiro.builder()
                        .cliente(ordemServico.getCliente())
                        .ordemServico(ordemServico)
                        .valor(ordemServico.getValorTotal())
                        .tipo(FinanceiroTipo.SERVICO)
                        .formaPagamento("A DEFINIR")
                        .status(FinanceiroStatus.PENDENTE)
                        .data(LocalDate.now())
                        .build()));
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public void vincularNota(OrdemServico ordemServico, NotaFiscalSimulada notaFiscal) {
        Financeiro financeiro = financeiroRepository.findTopByOrdemServicoIdAndTipoOrderByIdDesc(ordemServico.getId(), FinanceiroTipo.SERVICO)
                .or(() -> financeiroRepository.findTopByOrdemServicoIdOrderByIdDesc(ordemServico.getId()))
                .orElseGet(() -> createAutomaticoParaOrdemFinalizada(ordemServico));

        financeiro.setNotaFiscal(notaFiscal);
        financeiroRepository.save(financeiro);
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public void estornarPorNota(NotaFiscalSimulada notaFiscal) {
        Financeiro financeiro = financeiroRepository.findByNotaFiscalId(notaFiscal.getId())
                .orElseGet(() -> financeiroRepository.findTopByOrdemServicoIdOrderByIdDesc(notaFiscal.getOrdemServico().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Financeiro nao encontrado para a nota fiscal")));

        financeiro.setStatus(FinanceiroStatus.ESTORNADO);
        financeiroRepository.save(financeiro);
    }

    @Transactional(readOnly = true)
    public FinanceiroResponse getById(Long id) {
        return mapper.toFinanceiroResponse(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public Page<FinanceiroResponse> list(Pageable pageable) {
        return financeiroRepository.findAll(pageable).map(mapper::toFinanceiroResponse);
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public void delete(Long id) {
        Financeiro financeiro = findEntityById(id);
        financeiroRepository.delete(financeiro);
    }

    @Transactional(readOnly = true)
    public Financeiro findEntityById(Long id) {
        return financeiroRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Financeiro nao encontrado com id " + id));
    }

    private OrdemServico findOrdemById(Long ordemServicoId) {
        return ordemServicoRepository.findById(ordemServicoId)
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de servico nao encontrada com id " + ordemServicoId));
    }

    private void validarRelacionamento(Cliente cliente, OrdemServico ordemServico) {
        if (ordemServico == null) return;
        if (!ordemServico.getCliente().getId().equals(cliente.getId())) {
            throw new BadRequestException("A OS informada nao pertence ao cliente selecionado.");
        }
    }
}
