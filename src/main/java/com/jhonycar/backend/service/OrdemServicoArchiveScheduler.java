package com.jhonycar.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrdemServicoArchiveScheduler {

    private final OrdemServicoService ordemServicoService;
    @Value("${app.os.archive-zone:America/Sao_Paulo}")
    private String archiveZone;

    @Scheduled(cron = "${app.os.archive-cron:0 0 0 * * *}", zone = "${app.os.archive-zone:America/Sao_Paulo}")
    public void arquivarFinalizadasAutomaticamente() {
        LocalDateTime inicioDoDiaAtual = LocalDate.now(ZoneId.of(archiveZone)).atStartOfDay();
        int totalArquivadas = ordemServicoService.arquivarOrdensFinalizadasAte(inicioDoDiaAtual);
        if (totalArquivadas > 0) {
            log.info("Arquivamento automatico de OS: {} ordem(ns) finalizada(s) arquivada(s).", totalArquivadas);
        } else {
            log.debug("Arquivamento automatico de OS: nenhuma ordem elegivel.");
        }
    }
}
