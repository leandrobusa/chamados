package br.com.sistemas.chamados.config;

import java.time.LocalDateTime;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import br.com.sistemas.chamados.entity.Categoria;
import br.com.sistemas.chamados.entity.Chamado;
import br.com.sistemas.chamados.entity.Cliente;
import br.com.sistemas.chamados.entity.Comentario;
import br.com.sistemas.chamados.entity.Perfil;
import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;
import br.com.sistemas.chamados.entity.Tecnico;
import br.com.sistemas.chamados.repository.CategoriaRepository;
import br.com.sistemas.chamados.repository.ChamadoRepository;
import br.com.sistemas.chamados.repository.ClienteRepository;
import br.com.sistemas.chamados.repository.ComentarioRepository;
import br.com.sistemas.chamados.repository.TecnicoRepository;

@Configuration
@Profile("demo")
public class DadosIniciais {

    @Bean
    public CommandLineRunner carregarDadosDemonstracao(
            ClienteRepository clientes,
            CategoriaRepository categorias,
            TecnicoRepository tecnicos,
            ChamadoRepository chamados,
            ComentarioRepository comentarios) {
        return args -> {
            if (clientes.count() > 0) {
                return;
            }

            Cliente ana = clientes.save(new Cliente("Ana Souza", "ana@exemplo.com", "47999999999"));
            Cliente joao = clientes.save(new Cliente("João Silva", "joao@exemplo.com", "47988888888"));

            Categoria hardware = categorias.save(new Categoria("Hardware", "Problemas com equipamentos"));
            Categoria software = categorias.save(new Categoria("Software", "Problemas com sistemas e aplicativos"));
            categorias.save(new Categoria("Rede", "Problemas de conectividade"));

            Tecnico admin = tecnicos.save(new Tecnico("Carlos Admin", "carlos@exemplo.com", Perfil.ADMIN));
            Tecnico tecnico = tecnicos.save(new Tecnico("Marta Técnica", "marta@exemplo.com", Perfil.TECNICO));

            Chamado c1 = new Chamado("Computador não liga", "O computador não dá sinal de vídeo",
                Prioridade.ALTA, ana, hardware);
            c1.setStatus(StatusChamado.ABERTO);
            c1.setDataAbertura(LocalDateTime.now());
            chamados.save(c1);

            Chamado c2 = new Chamado("Erro ao abrir o sistema", "O sistema fecha logo após o login",
                Prioridade.CRITICA, joao, software);
            c2.setStatus(StatusChamado.EM_ATENDIMENTO);
            c2.setDataAbertura(LocalDateTime.now());
            c2.setTecnico(tecnico);
            chamados.save(c2);

            Chamado c3 = new Chamado("Troca de mouse", "Mouse com defeito no botão esquerdo",
                Prioridade.BAIXA, ana, hardware);
            c3.setStatus(StatusChamado.FECHADO);
            c3.setDataAbertura(LocalDateTime.now().minusDays(2));
            c3.setDataFechamento(LocalDateTime.now());
            c3.setTecnico(admin);
            chamados.save(c3);

            comentarios.save(new Comentario("Estou verificando o erro nos logs.", tecnico.getNome(),
                LocalDateTime.now(), c2));
        };
    }
}
