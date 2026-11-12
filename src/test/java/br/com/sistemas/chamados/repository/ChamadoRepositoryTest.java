package br.com.sistemas.chamados.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import br.com.sistemas.chamados.entity.Categoria;
import br.com.sistemas.chamados.entity.Chamado;
import br.com.sistemas.chamados.entity.Cliente;
import br.com.sistemas.chamados.entity.Comentario;
import br.com.sistemas.chamados.entity.Perfil;
import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;
import br.com.sistemas.chamados.entity.Tecnico;

@DataJpaTest
class ChamadoRepositoryTest {

    @Autowired
    private ChamadoRepository repository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private TecnicoRepository tecnicoRepository;

    @Autowired
    private ComentarioRepository comentarioRepository;

    private Cliente cliente;
    private Categoria categoria;

    @BeforeEach
    void preparar() {
        cliente = clienteRepository.save(new Cliente("Ana Souza", "ana@exemplo.com", "47999999999"));
        categoria = categoriaRepository.save(new Categoria("Hardware", "Equipamentos"));
    }

    private Chamado novoChamado(String titulo, Prioridade prioridade, StatusChamado status) {
        Chamado chamado = new Chamado(titulo, "Descrição", prioridade, cliente, categoria);
        chamado.setStatus(status);
        chamado.setDataAbertura(LocalDateTime.now());
        return repository.save(chamado);
    }

    @Test
    void persisteChamadoComRelacionamentos() {
        Chamado salvo = novoChamado("Computador não liga", Prioridade.ALTA, StatusChamado.ABERTO);

        Chamado encontrado = repository.findById(salvo.getId()).orElseThrow();

        assertNotNull(encontrado.getId());
        assertEquals(cliente.getId(), encontrado.getCliente().getId());
        assertEquals(categoria.getId(), encontrado.getCategoria().getId());
        assertNull(encontrado.getTecnico());
    }

    @Test
    void persisteChamadoComTecnico() {
        Tecnico tecnico = tecnicoRepository.save(new Tecnico("Marta", "marta@exemplo.com", Perfil.TECNICO));
        Chamado chamado = novoChamado("Computador não liga", Prioridade.ALTA, StatusChamado.ABERTO);
        chamado.setTecnico(tecnico);
        repository.saveAndFlush(chamado);

        Chamado encontrado = repository.findById(chamado.getId()).orElseThrow();

        assertEquals(tecnico.getId(), encontrado.getTecnico().getId());
    }

    @Test
    void contaChamadosPorStatus() {
        novoChamado("Um", Prioridade.ALTA, StatusChamado.ABERTO);
        novoChamado("Dois", Prioridade.BAIXA, StatusChamado.ABERTO);
        novoChamado("Três", Prioridade.ALTA, StatusChamado.FECHADO);

        assertEquals(2, repository.countByStatus(StatusChamado.ABERTO));
        assertEquals(1, repository.countByStatus(StatusChamado.FECHADO));
        assertEquals(0, repository.countByStatus(StatusChamado.EM_ATENDIMENTO));
    }

    @Test
    void contaChamadosPorPrioridade() {
        novoChamado("Um", Prioridade.ALTA, StatusChamado.ABERTO);
        novoChamado("Dois", Prioridade.BAIXA, StatusChamado.ABERTO);
        novoChamado("Três", Prioridade.ALTA, StatusChamado.FECHADO);

        assertEquals(2, repository.countByPrioridade(Prioridade.ALTA));
        assertEquals(1, repository.countByPrioridade(Prioridade.BAIXA));
        assertEquals(0, repository.countByPrioridade(Prioridade.CRITICA));
    }

    @Test
    void listaComentariosDoChamadoEmOrdemCronologica() {
        Chamado chamado = novoChamado("Computador não liga", Prioridade.ALTA, StatusChamado.ABERTO);
        LocalDateTime agora = LocalDateTime.now();
        comentarioRepository.save(new Comentario("Segundo", "Marta", agora.plusMinutes(5), chamado));
        comentarioRepository.save(new Comentario("Primeiro", "Ana", agora, chamado));

        var comentarios = comentarioRepository.findByChamadoIdOrderByDataAsc(chamado.getId());

        assertEquals(2, comentarios.size());
        assertEquals("Primeiro", comentarios.get(0).getTexto());
        assertEquals("Segundo", comentarios.get(1).getTexto());
    }
}
