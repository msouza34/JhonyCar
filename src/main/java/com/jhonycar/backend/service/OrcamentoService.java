package com.jhonycar.backend.service;

import com.jhonycar.backend.dto.OrcamentoConverterRequest;
import com.jhonycar.backend.dto.OrcamentoItemRequest;
import com.jhonycar.backend.dto.OrcamentoResponse;
import com.jhonycar.backend.dto.OrcamentoRequest;
import com.jhonycar.backend.entity.Cliente;
import com.jhonycar.backend.entity.Orcamento;
import com.jhonycar.backend.entity.OrcamentoItem;
import com.jhonycar.backend.entity.Veiculo;
import com.jhonycar.backend.entity.enums.OrcamentoItemTipo;
import com.jhonycar.backend.entity.enums.OrcamentoStatus;
import com.jhonycar.backend.exception.BadRequestException;
import com.jhonycar.backend.exception.ResourceNotFoundException;
import com.jhonycar.backend.repository.OrcamentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrcamentoService {

    private final OrcamentoRepository orcamentoRepository;
    private final ClienteService clienteService;
    private final VeiculoService veiculoService;
    private final DtoMapper mapper;

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public OrcamentoResponse create(OrcamentoRequest request) {
        Cliente cliente = clienteService.findEntityById(request.clienteId());
        Veiculo veiculo = resolveVeiculo(request.veiculoId(), cliente.getId());

        Orcamento orcamento = Orcamento.builder()
                .numero(gerarProximoNumero())
                .cliente(cliente)
                .veiculo(veiculo)
                .veiculoModelo(request.veiculoModelo().trim())
                .veiculoAno(request.veiculoAno())
                .veiculoPlaca(normalizarPlaca(request.veiculoPlaca()))
                .veiculoChassi(normalizarTexto(request.veiculoChassi()))
                .status(request.status() == null ? OrcamentoStatus.PENDENTE : request.status())
                .validadeEm(request.validadeEm() == null ? LocalDate.now().plusDays(7) : request.validadeEm())
                .vendedor(request.vendedor().trim())
                .formaPagamento(request.formaPagamento().trim())
                .desconto(normalizarMoeda(request.desconto()))
                .convertidoEmOs(Boolean.FALSE)
                .osNumero(null)
                .build();

        atualizarItens(orcamento, request.servicos(), request.pecas());
        orcamento.setValorTotal(calcularTotal(orcamento));
        return mapper.toOrcamentoResponse(orcamentoRepository.save(orcamento));
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public OrcamentoResponse update(Long id, OrcamentoRequest request) {
        Orcamento orcamento = findEntityById(id);
        Cliente cliente = clienteService.findEntityById(request.clienteId());
        Veiculo veiculo = resolveVeiculo(request.veiculoId(), cliente.getId());

        orcamento.setCliente(cliente);
        orcamento.setVeiculo(veiculo);
        orcamento.setVeiculoModelo(request.veiculoModelo().trim());
        orcamento.setVeiculoAno(request.veiculoAno());
        orcamento.setVeiculoPlaca(normalizarPlaca(request.veiculoPlaca()));
        orcamento.setVeiculoChassi(normalizarTexto(request.veiculoChassi()));
        orcamento.setStatus(request.status() == null ? orcamento.getStatus() : request.status());
        orcamento.setValidadeEm(request.validadeEm() == null ? orcamento.getValidadeEm() : request.validadeEm());
        orcamento.setVendedor(request.vendedor().trim());
        orcamento.setFormaPagamento(request.formaPagamento().trim());
        orcamento.setDesconto(normalizarMoeda(request.desconto()));

        atualizarItens(orcamento, request.servicos(), request.pecas());
        orcamento.setValorTotal(calcularTotal(orcamento));

        if (orcamento.getStatus() != OrcamentoStatus.APROVADO) {
            orcamento.setConvertidoEmOs(Boolean.FALSE);
            orcamento.setOsNumero(null);
        }

        return mapper.toOrcamentoResponse(orcamentoRepository.save(orcamento));
    }

    @Transactional(readOnly = true)
    public OrcamentoResponse getById(Long id) {
        return mapper.toOrcamentoResponse(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public List<OrcamentoResponse> list(Long clienteId) {
        List<Orcamento> items = clienteId == null
                ? orcamentoRepository.findAllByOrderByIdDesc()
                : orcamentoRepository.findByClienteIdOrderByIdDesc(clienteId);

        return items.stream().map(mapper::toOrcamentoResponse).toList();
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public void delete(Long id) {
        Orcamento orcamento = findEntityById(id);
        orcamentoRepository.delete(orcamento);
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public OrcamentoResponse updateStatus(Long id, OrcamentoStatus status) {
        Orcamento orcamento = findEntityById(id);
        orcamento.setStatus(status);
        if (status != OrcamentoStatus.APROVADO) {
            orcamento.setConvertidoEmOs(Boolean.FALSE);
            orcamento.setOsNumero(null);
        }
        return mapper.toOrcamentoResponse(orcamentoRepository.save(orcamento));
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public OrcamentoResponse converterEmOs(Long id, OrcamentoConverterRequest request) {
        Orcamento orcamento = findEntityById(id);
        if (orcamento.getStatus() != OrcamentoStatus.APROVADO) {
            throw new BadRequestException("Somente orcamentos aprovados podem ser convertidos em OS.");
        }
        orcamento.setConvertidoEmOs(Boolean.TRUE);
        if (request != null && request.osNumero() != null && !request.osNumero().isBlank()) {
            orcamento.setOsNumero(request.osNumero().trim().toUpperCase());
        } else if (orcamento.getOsNumero() == null || orcamento.getOsNumero().isBlank()) {
            orcamento.setOsNumero("OS-" + orcamento.getId());
        }
        return mapper.toOrcamentoResponse(orcamentoRepository.save(orcamento));
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public OrcamentoResponse duplicate(Long id) {
        Orcamento original = findEntityById(id);
        Orcamento clone = Orcamento.builder()
                .numero(gerarProximoNumero())
                .cliente(original.getCliente())
                .veiculo(original.getVeiculo())
                .veiculoModelo(original.getVeiculoModelo())
                .veiculoAno(original.getVeiculoAno())
                .veiculoPlaca(original.getVeiculoPlaca())
                .veiculoChassi(original.getVeiculoChassi())
                .status(OrcamentoStatus.PENDENTE)
                .validadeEm(original.getValidadeEm())
                .vendedor(original.getVendedor())
                .formaPagamento(original.getFormaPagamento())
                .desconto(original.getDesconto())
                .convertidoEmOs(Boolean.FALSE)
                .osNumero(null)
                .build();

        List<OrcamentoItemRequest> servicos = new ArrayList<>();
        List<OrcamentoItemRequest> pecas = new ArrayList<>();
        for (OrcamentoItem item : original.getItens()) {
            OrcamentoItemRequest dto = new OrcamentoItemRequest(
                    item.getDescricao(),
                    item.getCodigo(),
                    item.getQuantidade(),
                    item.getValorUnitario(),
                    item.getGarantia()
            );
            if (item.getTipo() == OrcamentoItemTipo.SERVICO) {
                servicos.add(dto);
            } else {
                pecas.add(dto);
            }
        }

        atualizarItens(clone, servicos, pecas);
        clone.setValorTotal(calcularTotal(clone));
        return mapper.toOrcamentoResponse(orcamentoRepository.save(clone));
    }

    @Transactional(readOnly = true)
    public Orcamento findEntityById(Long id) {
        return orcamentoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orcamento nao encontrado com id " + id));
    }

    private Veiculo resolveVeiculo(Long veiculoId, Long clienteId) {
        if (veiculoId == null) return null;
        Veiculo veiculo = veiculoService.findEntityById(veiculoId);
        if (!veiculo.getCliente().getId().equals(clienteId)) {
            throw new BadRequestException("Veiculo nao pertence ao cliente informado.");
        }
        return veiculo;
    }

    private void atualizarItens(Orcamento orcamento, List<OrcamentoItemRequest> servicos, List<OrcamentoItemRequest> pecas) {
        orcamento.getItens().clear();

        if (servicos != null) {
            for (OrcamentoItemRequest servico : servicos) {
                orcamento.getItens().add(toItem(orcamento, OrcamentoItemTipo.SERVICO, servico));
            }
        }
        if (pecas != null) {
            for (OrcamentoItemRequest peca : pecas) {
                orcamento.getItens().add(toItem(orcamento, OrcamentoItemTipo.PECA, peca));
            }
        }
    }

    private OrcamentoItem toItem(Orcamento orcamento, OrcamentoItemTipo tipo, OrcamentoItemRequest request) {
        return OrcamentoItem.builder()
                .orcamento(orcamento)
                .tipo(tipo)
                .descricao(request.descricao().trim())
                .codigo(normalizarTexto(request.codigo()))
                .quantidade(request.quantidade() == null ? 0 : request.quantidade())
                .valorUnitario(normalizarMoeda(request.valorUnitario()))
                .garantia(normalizarTexto(request.garantia()))
                .build();
    }

    private BigDecimal calcularTotal(Orcamento orcamento) {
        BigDecimal subtotal = orcamento.getItens().stream()
                .map(item -> item.getValorUnitario().multiply(BigDecimal.valueOf(item.getQuantidade())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return subtotal.subtract(normalizarMoeda(orcamento.getDesconto())).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizarMoeda(BigDecimal valor) {
        return (valor == null ? BigDecimal.ZERO : valor).setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizarPlaca(String placa) {
        return placa == null ? "" : placa.trim().toUpperCase();
    }

    private String normalizarTexto(String valor) {
        if (valor == null) return null;
        String trimmed = valor.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String gerarProximoNumero() {
        int ultimo = orcamentoRepository.findTopByOrderByIdDesc()
                .map(orcamento -> extrairNumero(orcamento.getNumero()))
                .orElse(0);
        return "ORC-" + String.format("%04d", ultimo + 1);
    }

    private int extrairNumero(String numero) {
        if (numero == null || numero.isBlank()) return 0;
        String[] partes = numero.split("-");
        if (partes.length < 2) return 0;
        try {
            return Integer.parseInt(partes[1]);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}

