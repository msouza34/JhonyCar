package com.jhonycar.backend.service.veiculos;

import com.jhonycar.backend.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;

@Service
public class VeiculoImagemStorageService {

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Value("${app.veiculos.image-storage-dir:storage/veiculos}")
    private String storageDir;

    public String salvarImagem(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new BadRequestException("Arquivo de imagem e obrigatorio");
        }

        String contentType = arquivo.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new BadRequestException("Somente arquivos de imagem sao permitidos");
        }

        String extensao = resolveExtensao(arquivo.getOriginalFilename(), contentType);
        String fileName = UUID.randomUUID() + extensao;

        Path directory = Paths.get(storageDir).toAbsolutePath().normalize();
        Path target = directory.resolve(fileName).normalize();

        if (!target.startsWith(directory)) {
            throw new BadRequestException("Nome de arquivo invalido");
        }

        try {
            Files.createDirectories(directory);
            arquivo.transferTo(target);
        } catch (IOException ex) {
            throw new BadRequestException("Nao foi possivel salvar a imagem do veiculo");
        }

        return normalizeBaseUrl() + "/veiculos/imagens/" + fileName;
    }

    public Resource carregarImagemOuPlaceholder(String fileName) {
        if (!StringUtils.hasText(fileName) || "placeholder.svg".equalsIgnoreCase(fileName)) {
            return placeholderAsResource("JhonyCar");
        }

        if (!fileName.matches("[a-zA-Z0-9._-]+")) {
            throw new BadRequestException("Nome de imagem invalido");
        }

        Path directory = Paths.get(storageDir).toAbsolutePath().normalize();
        Path target = directory.resolve(fileName).normalize();

        if (!target.startsWith(directory) || !Files.exists(target) || !Files.isRegularFile(target)) {
            return placeholderAsResource("Imagem nao encontrada");
        }

        try {
            return new ByteArrayResource(Files.readAllBytes(target));
        } catch (IOException ex) {
            return placeholderAsResource("Imagem indisponivel");
        }
    }

    public MediaType resolveMediaType(String fileName) {
        if (fileName == null || fileName.endsWith(".svg")) {
            return MediaType.valueOf("image/svg+xml");
        }
        return MediaTypeFactory.getMediaType(fileName).orElse(MediaType.APPLICATION_OCTET_STREAM);
    }

    public String placeholderUrlFor(String marca, String modelo) {
        return normalizeBaseUrl() + "/veiculos/imagens/placeholder.svg";
    }

    private Resource placeholderAsResource(String label) {
        String svg = buildPlaceholderSvg(sanitizeLabel(label));
        return new ByteArrayResource(svg.getBytes(StandardCharsets.UTF_8));
    }

    private String buildPlaceholderSvg(String label) {
        String safeLabel = escapeXml(label == null || label.isBlank() ? "JhonyCar" : label);
        return """
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'>
                  <defs>
                    <linearGradient id='bg' x1='0' x2='1' y1='0' y2='1'>
                      <stop offset='0%%' stop-color='#0b1730'/>
                      <stop offset='100%%' stop-color='#142a52'/>
                    </linearGradient>
                  </defs>
                  <rect width='640' height='360' fill='url(#bg)' rx='24'/>
                  <g fill='none' stroke='#8ba6d8' stroke-width='12' stroke-linecap='round' stroke-linejoin='round'>
                    <path d='M165 215h310l-24-58a28 28 0 0 0-26-17H213a28 28 0 0 0-26 17l-22 58z'/>
                    <circle cx='226' cy='228' r='22'/>
                    <circle cx='414' cy='228' r='22'/>
                    <path d='M186 205h272'/>
                  </g>
                  <text x='320' y='305' text-anchor='middle' fill='#dbe8ff' font-size='24' font-family='Arial, sans-serif'>%s</text>
                </svg>
                """.formatted(safeLabel);
    }

    private String sanitizeLabel(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\s+", " ").trim();
    }

    private String escapeXml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private String resolveExtensao(String originalFilename, String contentType) {
        String extByName = "";
        if (StringUtils.hasText(originalFilename) && originalFilename.contains(".")) {
            extByName = originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase(Locale.ROOT);
        }

        if (extByName.matches("\\.(jpg|jpeg|png|gif|webp|svg)$")) {
            return extByName;
        }

        if (contentType.toLowerCase(Locale.ROOT).contains("png")) {
            return ".png";
        }
        if (contentType.toLowerCase(Locale.ROOT).contains("jpeg") || contentType.toLowerCase(Locale.ROOT).contains("jpg")) {
            return ".jpg";
        }
        if (contentType.toLowerCase(Locale.ROOT).contains("gif")) {
            return ".gif";
        }
        if (contentType.toLowerCase(Locale.ROOT).contains("webp")) {
            return ".webp";
        }
        if (contentType.toLowerCase(Locale.ROOT).contains("svg")) {
            return ".svg";
        }

        return ".png";
    }

    private String normalizeBaseUrl() {
        if (baseUrl == null) {
            return "http://localhost:8080";
        }
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }
}
