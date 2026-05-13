package com.jhonycar.backend.controller;

import com.jhonycar.backend.dto.WhatsappLinkResponse;
import com.jhonycar.backend.service.FinanceiroService;
import com.jhonycar.backend.service.NotaFiscalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/integracoes/whatsapp")
@RequiredArgsConstructor
@Tag(name = "Integracoes")
@SecurityRequirement(name = "bearerAuth")
public class IntegracaoController {

    private final FinanceiroService financeiroService;
    private final NotaFiscalService notaFiscalService;

    @GetMapping("/orcamento/{financeiroId}")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Gerar link WhatsApp para orcamento")
    public ResponseEntity<WhatsappLinkResponse> linkOrcamento(@PathVariable Long financeiroId) {
        String link = financeiroService.getById(financeiroId).linkWhatsapp();
        return ResponseEntity.ok(new WhatsappLinkResponse(link));
    }

    @GetMapping("/nota/{notaId}")
    @PreAuthorize("hasAnyRole('ADMIN','FUNCIONARIO')")
    @Operation(summary = "Gerar link WhatsApp para nota")
    public ResponseEntity<WhatsappLinkResponse> linkNota(@PathVariable Long notaId) {
        String link = notaFiscalService.getById(notaId).linkWhatsapp();
        return ResponseEntity.ok(new WhatsappLinkResponse(link));
    }
}
