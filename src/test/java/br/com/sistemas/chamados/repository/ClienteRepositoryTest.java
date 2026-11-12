package br.com.sistemas.chamados.repository;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import br.com.sistemas.chamados.entity.Cliente;

@DataJpaTest
class ClienteRepositoryTest {

    @Autowired
    private ClienteRepository repository;

    @Test
    void salvaClienteEGeraId() {
        Cliente salvo = repository.save(new Cliente("Ana Souza", "ana@exemplo.com", "47999999999"));

        assertNotNull(salvo.getId());
    }

    @Test
    void existsByEmailIdentificaEmailCadastrado() {
        repository.save(new Cliente("Ana Souza", "ana@exemplo.com", "47999999999"));

        assertTrue(repository.existsByEmail("ana@exemplo.com"));
        assertFalse(repository.existsByEmail("outro@exemplo.com"));
    }

    @Test
    void existsByEmailAndIdNotIgnoraOProprioCliente() {
        Cliente ana = repository.save(new Cliente("Ana Souza", "ana@exemplo.com", "47999999999"));
        Cliente bia = repository.save(new Cliente("Bia Lima", "bia@exemplo.com", "47977777777"));

        assertFalse(repository.existsByEmailAndIdNot("ana@exemplo.com", ana.getId()));
        assertTrue(repository.existsByEmailAndIdNot("ana@exemplo.com", bia.getId()));
    }

    @Test
    void emailDuplicadoViolaConstraintUnique() {
        repository.saveAndFlush(new Cliente("Ana Souza", "ana@exemplo.com", "47999999999"));

        assertThrows(DataIntegrityViolationException.class,
            () -> repository.saveAndFlush(new Cliente("Outra Ana", "ana@exemplo.com", "47911111111")));
    }
}
