package br.com.sistemas.chamados.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import br.com.sistemas.chamados.dto.ComentarioResponse;
import br.com.sistemas.chamados.exception.RecursoNaoEncontradoException;
import br.com.sistemas.chamados.service.ComentarioService;

@WebMvcTest(ComentarioController.class)
class ComentarioControllerTest {

    private static final String JSON_VALIDO = """
        {"texto":"Estou verificando o problema.","autor":"Marta"}
        """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ComentarioService service;

    @Test
    void criarRetorna201() throws Exception {
        when(service.criar(any(), any())).thenReturn(
            new ComentarioResponse(1L, "Estou verificando o problema.", LocalDateTime.now(), "Marta", 1L));

        mockMvc.perform(post("/chamados/1/comentarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(JSON_VALIDO))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.autor").value("Marta"))
            .andExpect(jsonPath("$.chamadoId").value(1));
    }

    @Test
    void criarComDadosInvalidosRetorna400() throws Exception {
        String invalido = """
            {"texto":"","autor":""}
            """;

        mockMvc.perform(post("/chamados/1/comentarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalido))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.detalhes").isArray());
    }

    @Test
    void criarEmChamadoInexistenteRetorna404() throws Exception {
        when(service.criar(any(), any())).thenThrow(
            new RecursoNaoEncontradoException("Chamado 99999 não encontrado"));

        mockMvc.perform(post("/chamados/99999/comentarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(JSON_VALIDO))
            .andExpect(status().isNotFound());
    }

    @Test
    void listarRetorna200() throws Exception {
        when(service.listar(1L)).thenReturn(List.of(
            new ComentarioResponse(1L, "Estou verificando o problema.", LocalDateTime.now(), "Marta", 1L)));

        mockMvc.perform(get("/chamados/1/comentarios"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].texto").value("Estou verificando o problema."));
    }
}
