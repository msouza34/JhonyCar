package com.jhonycar.backend.service;

import com.jhonycar.backend.dto.OrdemServicoRequest;
import com.jhonycar.backend.dto.OrdemServicoResponse;
import com.jhonycar.backend.entity.Cliente;
import com.jhonycar.backend.entity.OrdemServico;
import com.jhonycar.backend.entity.Veiculo;
import com.jhonycar.backend.entity.enums.OrdemServicoStatus;
import com.jhonycar.backend.exception.BadRequestException;
import com.jhonycar.backend.exception.ResourceNotFoundException;
import com.jhonycar.backend.repository.OrdemServicoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OrdemServicoService {

    private final OrdemServicoRepository ordemServicoRepository;
    private final ClienteService clienteService;
    private final VeiculoService veiculoService;
    private final FinanceiroService financeiroService;
    private final DtoMapper mapper;

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public OrdemServicoResponse create(OrdemServicoRequest request) {
        Cliente cliente = clienteService.findEntityById(request.clienteId());
        Veiculo veiculo = veiculoService.findEntityById(request.veiculoId());

        if (!veiculo.getCliente().getId().equals(cliente.getId())) {
            throw new BadRequestException("Veiculo nao pertence ao cliente informado");
        }

        OrdemServicoStatus status = request.status() == null ? OrdemServicoStatus.RECEBIDO : request.status();

        OrdemServico ordemServico = OrdemServico.builder()
                .cliente(cliente)
                .veiculo(veiculo)
                .problemaRelatado(request.problemaRelatado())
                .diagnostico(request.diagnostico())
                .valorTotal(request.valorTotal() == null ? BigDecimal.ZERO : request.valorTotal())
                .status(status)
                .archived(false)
                .dataEntrada(request.dataEntrada() == null ? LocalDateTime.now() : request.dataEntrada())
                .dataSaida(request.dataSaida())
                .build();

        OrdemServico saved = ordemServicoRepository.save(ordemServico);
        if (saved.getStatus() == OrdemServicoStatus.FINALIZADO) {
            if (saved.getDataSaida() == null) {
                saved.setDataSaida(LocalDateTime.now());
                saved = ordemServicoRepository.save(saved);
            }
            financeiroService.createAutomaticoParaOrdemFinalizada(saved);
        }

        return mapper.toOrdemServicoResponse(saved);
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public OrdemServicoResponse update(Long id, OrdemServicoRequest request) {
        OrdemServico ordemServico = findEntityById(id);

        Cliente cliente = clienteService.findEntityById(request.clienteId());
        Veiculo veiculo = veiculoService.findEntityById(request.veiculoId());

        if (!veiculo.getCliente().getId().equals(cliente.getId())) {
            throw new BadRequestException("Veiculo nao pertence ao cliente informado");
        }

        ordemServico.setCliente(cliente);
        ordemServico.setVeiculo(veiculo);
        ordemServico.setProblemaRelatado(request.problemaRelatado());
        ordemServico.setDiagnostico(request.diagnostico());
        ordemServico.setValorTotal(request.valorTotal() == null ? BigDecimal.ZERO : request.valorTotal());
        if (request.status() != null) {
            ordemServico.setStatus(request.status());
            if (request.status() != OrdemServicoStatus.FINALIZADO) {
                ordemServico.setArchived(false);
            }
        }
        ordemServico.setDataEntrada(request.dataEntrada() == null ? ordemServico.getDataEntrada() : request.dataEntrada());
        ordemServico.setDataSaida(request.dataSaida());

        OrdemServico saved = ordemServicoRepository.save(ordemServico);

        if (saved.getStatus() == OrdemServicoStatus.FINALIZADO) {
            saved.setArchived(false);
            if (saved.getDataSaida() == null) {
                saved.setDataSaida(LocalDateTime.now());
            }
            saved = ordemServicoRepository.save(saved);
            financeiroService.createAutomaticoParaOrdemFinalizada(saved);
        }

        return mapper.toOrdemServicoResponse(saved);
    }

    @Transactional(readOnly = true)
    public OrdemServicoResponse getById(Long id) {
        return mapper.toOrdemServicoResponse(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public Page<OrdemServicoResponse> list(Pageable pageable, Boolean archived) {
        if (archived == null) {
            return ordemServicoRepository.findAll(pageable).map(mapper::toOrdemServicoResponse);
        }
        return ordemServicoRepository.findByArchived(archived, pageable).map(mapper::toOrdemServicoResponse);
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public void delete(Long id) {
        OrdemServico ordemServico = findEntityById(id);
        ordemServicoRepository.delete(ordemServico);
    }

    @Transactional(readOnly = true)
    public OrdemServico findEntityById(Long id) {
        return ordemServicoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de servico nao encontrada com id " + id));
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public int arquivarOrdensFinalizadasAte(LocalDateTime inicioDoDiaAtual) {
        return ordemServicoRepository.archiveFinalizadasAntesDoInicioDoDia(
                OrdemServicoStatus.FINALIZADO,
                inicioDoDiaAtual
        );
    }
}
