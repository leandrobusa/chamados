package br.com.sistemas.chamados.dto;

import java.util.Map;

import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;

public record DashboardResponse(
    long total,
    Map<StatusChamado, Long> porStatus,
    Map<Prioridade, Long> porPrioridade
) { }
