package br.com.sistemas.chamados.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import br.com.sistemas.chamados.dto.CategoriaResponse;
import br.com.sistemas.chamados.exception.RecursoNaoEncontradoException;
import br.com.sistemas.chamados.exception.RegraNegocioException;
import br.com.sistemas.chamados.service.CategoriaService;

@WebMvcTest(CategoriaController.class)
class CategoriaControllerTest {

    private static final String JSON_VALIDO = """
        {"nome":"Hardware","descricao":"Problemas com equipamentos"}
        """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CategoriaService service;

    @Test
    void criarRetorna201ComLocation() throws Exception {
        when(service.criar(any())).thenReturn(
            new CategoriaResponse(1L, "Hardware", "Problemas com equipamentos"));

        mockMvc.perform(post("/categorias").contentType(MediaType.APPLICATION_JSON).content(JSON_VALIDO))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", "/categorias/1"))
            .andExpect(jsonPath("$.nome").value("Hardware"));
    }

    @Test
    void criarComNomeEmBrancoRetorna400() throws Exception {
        String invalido = """
            {"nome":"","descricao":"Sem nome"}
            """;

        mockMvc.perform(post("/categorias").contentType(MediaType.APPLICATION_JSON).content(invalido))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.detalhes").isArray());
    }

    @Test
    void criarComNomeDuplicadoRetorna409() throws Exception {
        when(service.criar(any())).thenThrow(
            new RegraNegocioException("Já existe categoria com o nome Hardware"));

        mockMvc.perform(post("/categorias").contentType(MediaType.APPLICATION_JSON).content(JSON_VALIDO))
            .andExpect(status().isConflict());
    }

    @Test
    void listarRetorna200() throws Exception {
        when(service.listar()).thenReturn(List.of(new CategoriaResponse(1L, "Hardware", null)));

        mockMvc.perform(get("/categorias"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].nome").value("Hardware"));
    }

    @Test
    void buscarInexistenteRetorna404() throws Exception {
        when(service.buscar(99999L)).thenThrow(
            new RecursoNaoEncontradoException("Categoria 99999 não encontrada"));

        mockMvc.perform(get("/categorias/99999"))
            .andExpect(status().isNotFound());
    }

    @Test
    void atualizarRetorna200() throws Exception {
        when(service.atualizar(any(), any())).thenReturn(
            new CategoriaResponse(1L, "Hardware", "Problemas com equipamentos"));

        mockMvc.perform(put("/categorias/1").contentType(MediaType.APPLICATION_JSON).content(JSON_VALIDO))
            .andExpect(status().isOk());
    }

    @Test
    void excluirRetorna204() throws Exception {
        mockMvc.perform(delete("/categorias/1"))
            .andExpect(status().isNoContent());
    }
}
