package br.com.sistemas.chamados.repository;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import br.com.sistemas.chamados.entity.Categoria;

@DataJpaTest
class CategoriaRepositoryTest {

    @Autowired
    private CategoriaRepository repository;

    @Test
    void salvaCategoriaEGeraId() {
        Categoria salva = repository.save(new Categoria("Hardware", "Equipamentos"));

        assertNotNull(salva.getId());
    }

    @Test
    void existsByNomeIdentificaNomeCadastrado() {
        repository.save(new Categoria("Hardware", "Equipamentos"));

        assertTrue(repository.existsByNome("Hardware"));
        assertFalse(repository.existsByNome("Software"));
    }

    @Test
    void existsByNomeAndIdNotIgnoraAPropriaCategoria() {
        Categoria hardware = repository.save(new Categoria("Hardware", "Equipamentos"));
        Categoria software = repository.save(new Categoria("Software", "Sistemas"));

        assertFalse(repository.existsByNomeAndIdNot("Hardware", hardware.getId()));
        assertTrue(repository.existsByNomeAndIdNot("Hardware", software.getId()));
    }

    @Test
    void nomeDuplicadoViolaConstraintUnique() {
        repository.saveAndFlush(new Categoria("Hardware", "Equipamentos"));

        assertThrows(DataIntegrityViolationException.class,
            () -> repository.saveAndFlush(new Categoria("Hardware", "Outra descrição")));
    }
}
