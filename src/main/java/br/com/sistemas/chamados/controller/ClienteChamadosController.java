package br.com.sistemas.chamados.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PagedModel;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.sistemas.chamados.dto.ChamadoResponse;
import br.com.sistemas.chamados.service.ChamadoService;

@RestController
@RequestMapping("/clientes/{clienteId}/chamados")
public class ClienteChamadosController {

    private final ChamadoService service;

    public ClienteChamadosController(ChamadoService service) {
        this.service = service;
    }

    @GetMapping
    public PagedModel<ChamadoResponse> listar(
            @PathVariable Long clienteId,
            @PageableDefault(size = 10, sort = "dataAbertura", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return new PagedModel<>(service.listarPorCliente(clienteId, pageable));
    }
}
