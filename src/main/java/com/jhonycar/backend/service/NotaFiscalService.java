package com.jhonycar.backend.service;

import com.jhonycar.backend.dto.NotaFiscalResponse;
import com.jhonycar.backend.entity.NotaFiscalSimulada;
import com.jhonycar.backend.entity.OrdemServico;
import com.jhonycar.backend.entity.enums.NotaFiscalStatus;
import com.jhonycar.backend.entity.enums.OrdemServicoStatus;
import com.jhonycar.backend.exception.BadRequestException;
import com.jhonycar.backend.exception.ResourceNotFoundException;
import com.jhonycar.backend.repository.NotaFiscalSimuladaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotaFiscalService {

    private final NotaFiscalSimuladaRepository notaFiscalSimuladaRepository;
    private final OrdemServicoService ordemServicoService;
    private final FinanceiroService financeiroService;
    private final NotaFiscalEmitter notaFiscalEmitter;
    private final NotaFiscalPdfService notaFiscalPdfService;
    private final DtoMapper mapper;

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public NotaFiscalResponse simularPorOrdemServico(Long ordemServicoId) {
        OrdemServico os = ordemServicoService.findEntityById(ordemServicoId);
        if (os.getStatus() != OrdemServicoStatus.FINALIZADO) {
            throw new BadRequestException("A nota so pode ser gerada quando a ordem de servico estiver FINALIZADA");
        }

        NotaFiscalSimulada nota = notaFiscalEmitter.emitir(os);

        financeiroService.vincularNota(os, nota);

        return mapper.toNotaFiscalResponse(nota);
    }

    @Transactional
    @CacheEvict(value = {"dashboardResumo", "clienteCentral"}, allEntries = true)
    public NotaFiscalResponse cancelar(Long id, String motivoCancelamento) {
        NotaFiscalSimulada nota = findEntityById(id);

        if (nota.getStatus() == NotaFiscalStatus.CANCELADA) {
            throw new BadRequestException("Nota fiscal ja esta cancelada");
        }

        nota.setStatus(NotaFiscalStatus.CANCELADA);
        nota.setMotivoCancelamento(motivoCancelamento);
        nota.setDataCancelamento(java.time.LocalDateTime.now());
        nota.setPdfPath(notaFiscalPdfService.gerarPdf(nota));

        nota = notaFiscalSimuladaRepository.save(nota);
        financeiroService.estornarPorNota(nota);

        return mapper.toNotaFiscalResponse(nota);
    }

    @Transactional(readOnly = true)
    public NotaFiscalResponse getById(Long id) {
        return mapper.toNotaFiscalResponse(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public Page<NotaFiscalResponse> list(Pageable pageable) {
        return notaFiscalSimuladaRepository.findAll(pageable).map(mapper::toNotaFiscalResponse);
    }

    @Transactional(readOnly = true)
    public byte[] getPdf(Long id) {
        NotaFiscalSimulada nota = findEntityById(id);
        if (nota.getPdfPath() == null || nota.getPdfPath().isBlank()) {
            throw new BadRequestException("PDF da nota ainda nao foi gerado");
        }
        return notaFiscalPdfService.lerPdf(nota.getPdfPath());
    }

    @Transactional(readOnly = true)
    public NotaFiscalSimulada findEntityById(Long id) {
        return notaFiscalSimuladaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nota fiscal nao encontrada com id " + id));
    }
}
