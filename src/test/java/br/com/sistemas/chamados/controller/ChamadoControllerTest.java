package br.com.sistemas.chamados.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import br.com.sistemas.chamados.dto.ChamadoDetalheResponse;
import br.com.sistemas.chamados.dto.ChamadoResponse;
import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;
import br.com.sistemas.chamados.exception.RecursoNaoEncontradoException;
import br.com.sistemas.chamados.exception.RegraNegocioException;
import br.com.sistemas.chamados.service.ChamadoService;

@WebMvcTest({ChamadoController.class, ClienteChamadosController.class})
class ChamadoControllerTest {

    private static final String JSON_VALIDO = """
        {"titulo":"Computador não liga","descricao":"Sem sinal de vídeo","prioridade":"ALTA","clienteId":1,"categoriaId":1}
        """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ChamadoService service;

    private ChamadoResponse resposta(StatusChamado status) {
        return new ChamadoResponse(1L, "Computador não liga", "Sem sinal de vídeo",
            LocalDateTime.now(), null, Prioridade.ALTA, status,
            1L, "Ana Souza", 1L, "Hardware", null, null);
    }

    @Test
    void criarRetorna201ComStatusAberto() throws Exception {
        when(service.criar(any())).thenReturn(resposta(StatusChamado.ABERTO));

        mockMvc.perform(post("/chamados").contentType(MediaType.APPLICATION_JSON).content(JSON_VALIDO))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", "/chamados/1"))
            .andExpect(jsonPath("$.status").value("ABERTO"))
            .andExpect(jsonPath("$.dataAbertura").exists());
    }

    @Test
    void criarComDadosInvalidosRetorna400() throws Exception {
        String invalido = """
            {"titulo":"","prioridade":null,"clienteId":null,"categoriaId":null}
            """;

        mockMvc.perform(post("/chamados").contentType(MediaType.APPLICATION_JSON).content(invalido))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.detalhes").isArray());
    }

    @Test
    void criarComClienteInexistenteRetorna404() throws Exception {
        when(service.criar(any())).thenThrow(
            new RecursoNaoEncontradoException("Cliente 1 não encontrado"));

        mockMvc.perform(post("/chamados").contentType(MediaType.APPLICATION_JSON).content(JSON_VALIDO))
            .andExpect(status().isNotFound());
    }

    @Test
    void listarComFiltrosRetornaPaginaPaginada() throws Exception {
        when(service.listar(any(), any(), any(), any())).thenReturn(
            new PageImpl<>(List.of(resposta(StatusChamado.ABERTO)), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/chamados")
                .param("status", "ABERTO")
                .param("prioridade", "ALTA")
                .param("clienteId", "1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].id").value(1))
            .andExpect(jsonPath("$.page.totalElements").value(1));
    }

    @Test
    void listarComStatusInvalidoRetorna400() throws Exception {
        mockMvc.perform(get("/chamados").param("status", "INEXISTENTE"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void listarChamadosDoClienteRetornaPaginaPaginada() throws Exception {
        when(service.listarPorCliente(any(), any())).thenReturn(
            new PageImpl<>(List.of(resposta(StatusChamado.ABERTO)), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/clientes/1/chamados"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].clienteId").value(1));
    }

    @Test
    void listarChamadosDeClienteInexistenteRetorna404() throws Exception {
        when(service.listarPorCliente(any(), any())).thenThrow(
            new RecursoNaoEncontradoException("Cliente 99999 não encontrado"));

        mockMvc.perform(get("/clientes/99999/chamados"))
            .andExpect(status().isNotFound());
    }

    @Test
    void buscarRetornaDetalheComComentarios() throws Exception {
        when(service.buscar(1L)).thenReturn(new ChamadoDetalheResponse(
            1L, "Computador não liga", "Sem sinal de vídeo", LocalDateTime.now(), null,
            Prioridade.ALTA, StatusChamado.ABERTO, 1L, "Ana Souza", 1L, "Hardware",
            null, null, List.of()));

        mockMvc.perform(get("/chamados/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.comentarios").isArray());
    }

    @Test
    void buscarInexistenteRetorna404() throws Exception {
        when(service.buscar(99999L)).thenThrow(
            new RecursoNaoEncontradoException("Chamado 99999 não encontrado"));

        mockMvc.perform(get("/chamados/99999"))
            .andExpect(status().isNotFound());
    }

    @Test
    void atualizarChamadoFechadoRetorna409() throws Exception {
        when(service.atualizar(any(), any())).thenThrow(
            new RegraNegocioException("Chamado 1 está fechado e não pode ser alterado"));

        mockMvc.perform(put("/chamados/1").contentType(MediaType.APPLICATION_JSON).content(JSON_VALIDO))
            .andExpect(status().isConflict());
    }

    @Test
    void excluirRetorna204() throws Exception {
        mockMvc.perform(delete("/chamados/1"))
            .andExpect(status().isNoContent());
    }

    @Test
    void atribuirTecnicoRetorna200() throws Exception {
        when(service.atribuir(any(), any())).thenReturn(resposta(StatusChamado.ABERTO));

        mockMvc.perform(patch("/chamados/1/atribuir")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"tecnicoId\":1}"))
            .andExpect(status().isOk());
    }

    @Test
    void atribuirSemTecnicoRetorna400() throws Exception {
        mockMvc.perform(patch("/chamados/1/atribuir")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void atribuirEmChamadoFechadoRetorna409() throws Exception {
        when(service.atribuir(any(), any())).thenThrow(
            new RegraNegocioException("Chamado 1 está fechado e não pode ser alterado"));

        mockMvc.perform(patch("/chamados/1/atribuir")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"tecnicoId\":1}"))
            .andExpect(status().isConflict());
    }

    @Test
    void alterarStatusComTransicaoValidaRetorna200() throws Exception {
        when(service.alterarStatus(any(), any())).thenReturn(resposta(StatusChamado.EM_ATENDIMENTO));

        mockMvc.perform(patch("/chamados/1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"EM_ATENDIMENTO\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("EM_ATENDIMENTO"));
    }

    @Test
    void alterarStatusComTransicaoInvalidaRetorna409() throws Exception {
        when(service.alterarStatus(any(), any())).thenThrow(
            new RegraNegocioException("Transição de status inválida: ABERTO -> AGUARDANDO_CLIENTE"));

        mockMvc.perform(patch("/chamados/1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"AGUARDANDO_CLIENTE\"}"))
            .andExpect(status().isConflict());
    }

    @Test
    void alterarStatusSemStatusRetorna400() throws Exception {
        mockMvc.perform(patch("/chamados/1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }
}
