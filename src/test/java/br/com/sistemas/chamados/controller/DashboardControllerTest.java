package br.com.sistemas.chamados.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.EnumMap;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import br.com.sistemas.chamados.dto.DashboardResponse;
import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;
import br.com.sistemas.chamados.service.DashboardService;

@WebMvcTest(DashboardController.class)
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DashboardService service;

    @Test
    void resumoRetornaContagensPorStatusEPrioridade() throws Exception {
        Map<StatusChamado, Long> porStatus = new EnumMap<>(StatusChamado.class);
        porStatus.put(StatusChamado.ABERTO, 2L);
        Map<Prioridade, Long> porPrioridade = new EnumMap<>(Prioridade.class);
        porPrioridade.put(Prioridade.ALTA, 2L);
        when(service.resumo()).thenReturn(new DashboardResponse(2L, porStatus, porPrioridade));

        mockMvc.perform(get("/dashboard"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(2))
            .andExpect(jsonPath("$.porStatus.ABERTO").value(2))
            .andExpect(jsonPath("$.porPrioridade.ALTA").value(2));
    }
}
