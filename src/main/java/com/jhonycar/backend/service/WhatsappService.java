package com.jhonycar.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;

@Service
public class WhatsappService {

    public String gerarLink(String telefone, String mensagem) {
        String telefoneLimpo = telefone == null ? "" : telefone.replaceAll("[^0-9]", "");
        String mensagemCodificada = UriUtils.encode(mensagem, StandardCharsets.UTF_8);
        return "https://wa.me/" + telefoneLimpo + "?text=" + mensagemCodificada;
    }
}
