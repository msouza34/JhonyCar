package com.jhonycar.backend.service;

import com.jhonycar.backend.entity.NotaFiscalSimulada;
import com.jhonycar.backend.exception.BadRequestException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;

@Service
public class NotaFiscalPdfService {

    @Value("${app.pdf.storage-dir:storage/notas}")
    private String storageDir;

    public String gerarPdf(NotaFiscalSimulada nota) {
        Path directory = Paths.get(storageDir).toAbsolutePath().normalize();
        Path filePath = directory.resolve(nota.getNumero() + ".pdf");

        try {
            Files.createDirectories(directory);
            try (PDDocument document = new PDDocument()) {
                PDPage page = new PDPage(PDRectangle.A4);
                document.addPage(page);

                try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
                    content.newLineAtOffset(50, 780);
                    content.showText("Nota Fiscal Simulada - JhonyCar");
                    content.endText();

                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                    content.newLineAtOffset(50, 740);
                    content.showText("Numero: " + nota.getNumero());
                    content.newLineAtOffset(0, -20);
                    content.showText("Cliente: " + nota.getClienteNome());
                    content.newLineAtOffset(0, -20);
                    content.showText("CPF/CNPJ: " + nota.getCpfCnpj());
                    content.newLineAtOffset(0, -20);
                    content.showText("Servico: " + safeText(nota.getDescricaoServico()));
                    content.newLineAtOffset(0, -20);
                    content.showText("Valor: R$ " + nota.getValor());
                    content.newLineAtOffset(0, -20);
                    content.showText("Status: " + nota.getStatus());
                    content.newLineAtOffset(0, -20);
                    content.showText("Data Emissao: " + nota.getDataEmissao().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

                    if (nota.getDataCancelamento() != null) {
                        content.newLineAtOffset(0, -20);
                        content.showText("Data Cancelamento: " + nota.getDataCancelamento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
                        content.newLineAtOffset(0, -20);
                        content.showText("Motivo: " + safeText(nota.getMotivoCancelamento()));
                    }

                    content.newLineAtOffset(0, -40);
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                    content.showText("DOCUMENTO SEM VALOR FISCAL");

                    if (nota.getDataCancelamento() != null) {
                        content.newLineAtOffset(0, -25);
                        content.showText("NOTA CANCELADA");
                    }

                    content.endText();
                }

                document.save(filePath.toFile());
            }
        } catch (IOException ex) {
            throw new BadRequestException("Erro ao gerar PDF da nota");
        }

        return filePath.toString();
    }

    public byte[] lerPdf(String pdfPath) {
        try {
            return Files.readAllBytes(Paths.get(pdfPath));
        } catch (IOException ex) {
            throw new BadRequestException("Erro ao ler PDF da nota");
        }
    }

    private String safeText(String input) {
        return input == null ? "" : input.replaceAll("[\\r\\n]+", " ");
    }
}
