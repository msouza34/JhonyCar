package com.jhonycar.backend.service;

import com.jhonycar.backend.dto.AgendamentoRequest;
import com.jhonycar.backend.dto.AgendamentoResponse;
import com.jhonycar.backend.entity.Agendamento;
import com.jhonycar.backend.entity.Cliente;
import com.jhonycar.backend.entity.Veiculo;
import com.jhonycar.backend.exception.BadRequestException;
import com.jhonycar.backend.exception.ResourceNotFoundException;
import com.jhonycar.backend.repository.AgendamentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AgendamentoService {

    private final AgendamentoRepository agendamentoRepository;
    private final ClienteService clienteService;
    private final VeiculoService veiculoService;
    private final DtoMapper mapper;

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public AgendamentoResponse create(AgendamentoRequest request) {
        Cliente cliente = clienteService.findEntityById(request.clienteId());
        Veiculo veiculo = veiculoService.findEntityById(request.veiculoId());

        if (!veiculo.getCliente().getId().equals(cliente.getId())) {
            throw new BadRequestException("Veiculo nao pertence ao cliente informado");
        }

        Agendamento agendamento = Agendamento.builder()
                .cliente(cliente)
                .veiculo(veiculo)
                .dataHora(request.dataHora())
                .descricao(request.descricao())
                .status(request.status())
                .build();

        return mapper.toAgendamentoResponse(agendamentoRepository.save(agendamento));
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public AgendamentoResponse update(Long id, AgendamentoRequest request) {
        Agendamento agendamento = findEntityById(id);

        Cliente cliente = clienteService.findEntityById(request.clienteId());
        Veiculo veiculo = veiculoService.findEntityById(request.veiculoId());

        if (!veiculo.getCliente().getId().equals(cliente.getId())) {
            throw new BadRequestException("Veiculo nao pertence ao cliente informado");
        }

        agendamento.setCliente(cliente);
        agendamento.setVeiculo(veiculo);
        agendamento.setDataHora(request.dataHora());
        agendamento.setDescricao(request.descricao());
        if (request.status() != null) {
            agendamento.setStatus(request.status());
        }

        return mapper.toAgendamentoResponse(agendamentoRepository.save(agendamento));
    }

    @Transactional(readOnly = true)
    public AgendamentoResponse getById(Long id) {
        return mapper.toAgendamentoResponse(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public Page<AgendamentoResponse> list(Pageable pageable) {
        return agendamentoRepository.findAll(pageable).map(mapper::toAgendamentoResponse);
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public void delete(Long id) {
        Agendamento agendamento = findEntityById(id);
        agendamentoRepository.delete(agendamento);
    }

    @Transactional(readOnly = true)
    public Agendamento findEntityById(Long id) {
        return agendamentoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agendamento nao encontrado com id " + id));
    }
}
