package com.jhonycar.backend.service;

import com.jhonycar.backend.entity.NotaFiscalSimulada;
import com.jhonycar.backend.entity.OrdemServico;
import com.jhonycar.backend.entity.enums.NotaFiscalStatus;
import com.jhonycar.backend.exception.BadRequestException;
import com.jhonycar.backend.repository.NotaFiscalSimuladaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SimulatedNotaFiscalEmitter implements NotaFiscalEmitter {

    private final NotaFiscalSimuladaRepository notaFiscalSimuladaRepository;
    private final NotaFiscalPdfService notaFiscalPdfService;

    @Override
    @Transactional
    public NotaFiscalSimulada emitir(OrdemServico ordemServico) {
        if (notaFiscalSimuladaRepository.existsByOrdemServicoId(ordemServico.getId())) {
            throw new BadRequestException("Ja existe nota para essa ordem de servico");
        }

        String descricao = ordemServico.getDiagnostico() == null || ordemServico.getDiagnostico().isBlank()
                ? ordemServico.getProblemaRelatado()
                : ordemServico.getDiagnostico();

        NotaFiscalSimulada nota = NotaFiscalSimulada.builder()
                .numero(String.format("NF-%04d", notaFiscalSimuladaRepository.countBy() + 1))
                .clienteNome(ordemServico.getCliente().getNome())
                .cpfCnpj(ordemServico.getCliente().getCpfCnpj())
                .descricaoServico(descricao)
                .valor(ordemServico.getValorTotal())
                .status(NotaFiscalStatus.SIMULADA)
                .dataEmissao(LocalDateTime.now())
                .pdfPath("")
                .ordemServico(ordemServico)
                .build();

        nota = notaFiscalSimuladaRepository.save(nota);
        nota.setPdfPath(notaFiscalPdfService.gerarPdf(nota));
        return notaFiscalSimuladaRepository.save(nota);
    }
}
