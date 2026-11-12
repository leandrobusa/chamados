package br.com.sistemas.chamados.service;

import java.util.EnumMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.sistemas.chamados.dto.DashboardResponse;
import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;
import br.com.sistemas.chamados.repository.ChamadoRepository;

@Service
public class DashboardService {

    private final ChamadoRepository repository;

    public DashboardService(ChamadoRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse resumo() {
        Map<StatusChamado, Long> porStatus = new EnumMap<>(StatusChamado.class);
        for (StatusChamado status : StatusChamado.values()) {
            porStatus.put(status, repository.countByStatus(status));
        }
        Map<Prioridade, Long> porPrioridade = new EnumMap<>(Prioridade.class);
        for (Prioridade prioridade : Prioridade.values()) {
            porPrioridade.put(prioridade, repository.countByPrioridade(prioridade));
        }
        return new DashboardResponse(repository.count(), porStatus, porPrioridade);
    }
}
