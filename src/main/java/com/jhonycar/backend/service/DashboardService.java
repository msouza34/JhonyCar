package com.jhonycar.backend.service;

import com.jhonycar.backend.dto.DashboardResponse;
import com.jhonycar.backend.dto.StatusCountResponse;
import com.jhonycar.backend.entity.enums.FinanceiroStatus;
import com.jhonycar.backend.entity.enums.NotaFiscalStatus;
import com.jhonycar.backend.entity.enums.OrdemServicoStatus;
import com.jhonycar.backend.repository.ClienteRepository;
import com.jhonycar.backend.repository.FinanceiroRepository;
import com.jhonycar.backend.repository.NotaFiscalSimuladaRepository;
import com.jhonycar.backend.repository.OrdemServicoRepository;
import com.jhonycar.backend.repository.VeiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ClienteRepository clienteRepository;
    private final VeiculoRepository veiculoRepository;
    private final OrdemServicoRepository ordemServicoRepository;
    private final FinanceiroRepository financeiroRepository;
    private final NotaFiscalSimuladaRepository notaFiscalSimuladaRepository;

    @Transactional(readOnly = true)
    @Cacheable("dashboardResumo")
    public DashboardResponse getResumo() {
        long totalClientes = clienteRepository.count();
        long totalVeiculos = veiculoRepository.count();
        long totalOrdensServico = ordemServicoRepository.count();
        long ordensEmAberto = ordemServicoRepository.countByStatusNot(OrdemServicoStatus.FINALIZADO);

        LocalDate hoje = LocalDate.now();
        LocalDate inicioMes = hoje.withDayOfMonth(1);
        LocalDate fimMes = hoje.withDayOfMonth(hoje.lengthOfMonth());

        BigDecimal faturamentoMensal = financeiroRepository.sumByStatusAndDataBetween(
                FinanceiroStatus.PAGO,
                inicioMes,
                fimMes
        );

        long notasEmitidas = notaFiscalSimuladaRepository.countByStatus(NotaFiscalStatus.EMITIDA)
                + notaFiscalSimuladaRepository.countByStatus(NotaFiscalStatus.SIMULADA);
        long notasCanceladas = notaFiscalSimuladaRepository.countByStatus(NotaFiscalStatus.CANCELADA);

        List<StatusCountResponse> ordensPorStatus = ordemServicoRepository.countGroupByStatus().stream()
                .map(item -> new StatusCountResponse(
                        item[0] == null ? "SEM_STATUS" : item[0].toString(),
                        ((Number) item[1]).longValue()
                ))
                .toList();

        return new DashboardResponse(
                totalClientes,
                totalVeiculos,
                totalOrdensServico,
                ordensEmAberto,
                faturamentoMensal,
                notasEmitidas,
                notasCanceladas,
                ordensPorStatus
        );
    }
}
