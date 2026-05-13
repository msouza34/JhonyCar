package com.jhonycar.backend.service;

import com.jhonycar.backend.dto.VeiculoRequest;
import com.jhonycar.backend.dto.VeiculoResponse;
import com.jhonycar.backend.entity.Cliente;
import com.jhonycar.backend.entity.Veiculo;
import com.jhonycar.backend.exception.BadRequestException;
import com.jhonycar.backend.exception.ResourceNotFoundException;
import com.jhonycar.backend.repository.AgendamentoRepository;
import com.jhonycar.backend.repository.OrdemServicoRepository;
import com.jhonycar.backend.repository.VeiculoRepository;
import com.jhonycar.backend.service.veiculos.VeiculoModeloService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VeiculoService {

    private static final String DEFAULT_TENANT = "default";

    private final VeiculoRepository veiculoRepository;
    private final OrdemServicoRepository ordemServicoRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final ClienteService clienteService;
    private final VeiculoModeloService veiculoModeloService;
    private final DtoMapper mapper;

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public VeiculoResponse create(VeiculoRequest request) {
        if (veiculoRepository.existsByPlaca(request.placa())) {
            throw new BadRequestException("Ja existe veiculo com essa placa");
        }

        validarCatalogoVeiculo(request.marca(), request.modelo());

        Cliente cliente = clienteService.findEntityById(request.clienteId());

        Veiculo veiculo = Veiculo.builder()
                .placa(request.placa())
                .modelo(request.modelo())
                .marca(request.marca())
                .ano(request.ano())
                .cliente(cliente)
                .build();

        return mapper.toVeiculoResponse(veiculoRepository.save(veiculo));
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public VeiculoResponse update(Long id, VeiculoRequest request) {
        Veiculo veiculo = findEntityById(id);

        if (!veiculo.getPlaca().equals(request.placa()) && veiculoRepository.existsByPlaca(request.placa())) {
            throw new BadRequestException("Ja existe veiculo com essa placa");
        }

        validarCatalogoVeiculo(request.marca(), request.modelo());

        Cliente cliente = clienteService.findEntityById(request.clienteId());

        veiculo.setPlaca(request.placa());
        veiculo.setModelo(request.modelo());
        veiculo.setMarca(request.marca());
        veiculo.setAno(request.ano());
        veiculo.setCliente(cliente);

        return mapper.toVeiculoResponse(veiculoRepository.save(veiculo));
    }

    @Transactional(readOnly = true)
    public VeiculoResponse getById(Long id) {
        return mapper.toVeiculoResponse(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public Page<VeiculoResponse> list(Pageable pageable) {
        return veiculoRepository.findAll(pageable).map(mapper::toVeiculoResponse);
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public void delete(Long id) {
        Veiculo veiculo = findEntityById(id);

        if (ordemServicoRepository.existsByVeiculoId(id)) {
            throw new BadRequestException("Nao e possivel excluir: o veiculo possui ordens de servico vinculadas");
        }

        if (agendamentoRepository.existsByVeiculoId(id)) {
            throw new BadRequestException("Nao e possivel excluir: o veiculo possui agendamentos vinculados");
        }

        veiculoRepository.delete(veiculo);
    }

    @Transactional(readOnly = true)
    public Veiculo findEntityById(Long id) {
        return veiculoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Veiculo nao encontrado com id " + id));
    }

    private void validarCatalogoVeiculo(String marca, String modelo) {
        veiculoModeloService.garantirModeloCadastrado(DEFAULT_TENANT, marca, modelo);
        boolean existeModeloAtivo = veiculoModeloService.existeModeloAtivo(DEFAULT_TENANT, marca, modelo);
        if (!existeModeloAtivo) {
            throw new BadRequestException("Marca/modelo do veiculo nao esta ativa no catalogo");
        }
    }
}
