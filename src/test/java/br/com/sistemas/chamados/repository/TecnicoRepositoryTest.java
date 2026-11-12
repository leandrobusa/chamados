package br.com.sistemas.chamados.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import br.com.sistemas.chamados.entity.Perfil;
import br.com.sistemas.chamados.entity.Tecnico;

@DataJpaTest
class TecnicoRepositoryTest {

    @Autowired
    private TecnicoRepository repository;

    @Test
    void salvaTecnicoComPerfil() {
        Tecnico salvo = repository.save(new Tecnico("Marta", "marta@exemplo.com", Perfil.TECNICO));

        assertNotNull(salvo.getId());
        assertEquals(Perfil.TECNICO, repository.findById(salvo.getId()).orElseThrow().getPerfil());
    }

    @Test
    void existsByEmailIdentificaEmailCadastrado() {
        repository.save(new Tecnico("Marta", "marta@exemplo.com", Perfil.TECNICO));

        assertTrue(repository.existsByEmail("marta@exemplo.com"));
        assertFalse(repository.existsByEmail("outro@exemplo.com"));
    }

    @Test
    void existsByEmailAndIdNotIgnoraOProprioTecnico() {
        Tecnico marta = repository.save(new Tecnico("Marta", "marta@exemplo.com", Perfil.TECNICO));
        Tecnico carlos = repository.save(new Tecnico("Carlos", "carlos@exemplo.com", Perfil.ADMIN));

        assertFalse(repository.existsByEmailAndIdNot("marta@exemplo.com", marta.getId()));
        assertTrue(repository.existsByEmailAndIdNot("marta@exemplo.com", carlos.getId()));
    }

    @Test
    void emailDuplicadoViolaConstraintUnique() {
        repository.saveAndFlush(new Tecnico("Marta", "marta@exemplo.com", Perfil.TECNICO));

        assertThrows(DataIntegrityViolationException.class,
            () -> repository.saveAndFlush(new Tecnico("Outra", "marta@exemplo.com", Perfil.ADMIN)));
    }
}
