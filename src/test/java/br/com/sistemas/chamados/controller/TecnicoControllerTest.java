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

import br.com.sistemas.chamados.dto.TecnicoResponse;
import br.com.sistemas.chamados.entity.Perfil;
import br.com.sistemas.chamados.exception.RecursoNaoEncontradoException;
import br.com.sistemas.chamados.exception.RegraNegocioException;
import br.com.sistemas.chamados.service.TecnicoService;

@WebMvcTest(TecnicoController.class)
class TecnicoControllerTest {

    private static final String JSON_VALIDO = """
        {"nome":"Marta","email":"marta@exemplo.com","perfil":"TECNICO"}
        """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TecnicoService service;

    @Test
    void criarRetorna201ComLocation() throws Exception {
        when(service.criar(any())).thenReturn(
            new TecnicoResponse(1L, "Marta", "marta@exemplo.com", Perfil.TECNICO));

        mockMvc.perform(post("/tecnicos").contentType(MediaType.APPLICATION_JSON).content(JSON_VALIDO))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", "/tecnicos/1"))
            .andExpect(jsonPath("$.perfil").value("TECNICO"));
    }

    @Test
    void criarSemPerfilRetorna400() throws Exception {
        String invalido = """
            {"nome":"Marta","email":"marta@exemplo.com"}
            """;

        mockMvc.perform(post("/tecnicos").contentType(MediaType.APPLICATION_JSON).content(invalido))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.detalhes").isArray());
    }

    @Test
    void criarComEmailInvalidoRetorna400() throws Exception {
        String invalido = """
            {"nome":"Marta","email":"email-invalido","perfil":"ADMIN"}
            """;

        mockMvc.perform(post("/tecnicos").contentType(MediaType.APPLICATION_JSON).content(invalido))
            .andExpect(status().isBadRequest());
    }

    @Test
    void criarComEmailDuplicadoRetorna409() throws Exception {
        when(service.criar(any())).thenThrow(
            new RegraNegocioException("Já existe técnico com o e-mail marta@exemplo.com"));

        mockMvc.perform(post("/tecnicos").contentType(MediaType.APPLICATION_JSON).content(JSON_VALIDO))
            .andExpect(status().isConflict());
    }

    @Test
    void listarRetorna200() throws Exception {
        when(service.listar()).thenReturn(List.of(
            new TecnicoResponse(1L, "Marta", "marta@exemplo.com", Perfil.TECNICO)));

        mockMvc.perform(get("/tecnicos"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].nome").value("Marta"));
    }

    @Test
    void buscarInexistenteRetorna404() throws Exception {
        when(service.buscar(99999L)).thenThrow(
            new RecursoNaoEncontradoException("Técnico 99999 não encontrado"));

        mockMvc.perform(get("/tecnicos/99999"))
            .andExpect(status().isNotFound());
    }

    @Test
    void atualizarRetorna200() throws Exception {
        when(service.atualizar(any(), any())).thenReturn(
            new TecnicoResponse(1L, "Marta", "marta@exemplo.com", Perfil.TECNICO));

        mockMvc.perform(put("/tecnicos/1").contentType(MediaType.APPLICATION_JSON).content(JSON_VALIDO))
            .andExpect(status().isOk());
    }

    @Test
    void excluirRetorna204() throws Exception {
        mockMvc.perform(delete("/tecnicos/1"))
            .andExpect(status().isNoContent());
    }
}
