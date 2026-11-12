import { api } from './api.js';
import {
  h, trocar, cabecalho, tabela, vazio, formulario, confirmar, toast, mostrarErro, paginacao, selo, PERFIL,
} from './ui.js';
import { tabelaChamados } from './chamados.js';

const entidades = {
  clientes: {
    rota: 'clientes', singular: 'cliente', titulo: 'Clientes', novo: 'Novo cliente',
    sub: 'Quem abre chamados no sistema.',
    api: api.clientes,
    campos: () => [
      { nome: 'nome', rotulo: 'Nome', obrigatorio: true, max: 100 },
      { nome: 'email', rotulo: 'E-mail', tipo: 'email', obrigatorio: true, max: 120, exemplo: 'nome@empresa.com' },
      { nome: 'telefone', rotulo: 'Telefone', tipo: 'tel', max: 20, exemplo: '47999999999' },
    ],
    colunas: () => [
      { titulo: 'Nome', render: (c) => h('a', { class: 'titulo-link', href: `#/clientes/${c.id}` }, c.nome) },
      { titulo: 'E-mail', render: (c) => c.email },
      { titulo: 'Telefone', render: (c) => c.telefone ?? h('span', { class: 'mudo' }, '—') },
    ],
  },
  categorias: {
    rota: 'categorias', singular: 'categoria', titulo: 'Categorias', novo: 'Nova categoria',
    sub: 'Tipos de problema usados para organizar os chamados.',
    api: api.categorias,
    campos: () => [
      { nome: 'nome', rotulo: 'Nome', obrigatorio: true, max: 100 },
      { nome: 'descricao', rotulo: 'Descrição', tipo: 'textarea', max: 255 },
    ],
    colunas: () => [
      { titulo: 'Nome', render: (c) => h('span', { class: 'titulo-link' }, c.nome) },
      { titulo: 'Descrição', render: (c) => c.descricao ?? h('span', { class: 'mudo' }, '—') },
    ],
  },
  tecnicos: {
    rota: 'tecnicos', singular: 'técnico', titulo: 'Técnicos', novo: 'Novo técnico',
    sub: 'Quem atende os chamados.',
    api: api.tecnicos,
    campos: () => [
      { nome: 'nome', rotulo: 'Nome', obrigatorio: true, max: 100 },
      { nome: 'email', rotulo: 'E-mail', tipo: 'email', obrigatorio: true, max: 120, exemplo: 'nome@empresa.com' },
      { nome: 'perfil', rotulo: 'Perfil', tipo: 'select', obrigatorio: true,
        opcoes: Object.entries(PERFIL).map(([valor, rotulo]) => ({ valor, rotulo })) },
    ],
    colunas: () => [
      { titulo: 'Nome', render: (t) => h('span', { class: 'titulo-link' }, t.nome) },
      { titulo: 'E-mail', render: (t) => t.email },
      { titulo: 'Perfil', render: (t) => selo('perfil', t.perfil, PERFIL) },
    ],
  },
};

function lista(cfg) {
  return async () => {
    const raiz = h('div');

    async function desenhar(itens) {
      const colunas = [
        ...cfg.colunas(),
        { titulo: '', classe: 'acoes', render: (item) => [
          h('a', { class: 'botao sec mini', href: `#/${cfg.rota}/${item.id}/editar` }, 'Editar'),
          h('button', { class: 'botao perigo mini', type: 'button', onclick: () => excluir(item) }, 'Excluir'),
        ] },
      ];
      trocar(raiz,
        cabecalho({
          titulo: cfg.titulo, sub: cfg.sub,
          acoes: h('a', { class: 'botao', href: `#/${cfg.rota}/novo` }, cfg.novo),
        }),
        h('section', { class: 'painel', 'aria-label': `Lista de ${cfg.titulo.toLowerCase()}` },
          itens.length === 0
            ? vazio(`Nenhum ${cfg.singular} cadastrado`, `Cadastre o primeiro ${cfg.singular} para começar.`,
              h('a', { class: 'botao', href: `#/${cfg.rota}/novo` }, cfg.novo))
            : tabela(colunas, itens)));
    }

    async function excluir(item) {
      const ok = await confirmar({
        titulo: `Excluir ${cfg.singular}?`,
        mensagem: `${item.nome} será removido. Essa ação não pode ser desfeita.`,
        acao: `Excluir ${cfg.singular}`,
      });
      if (!ok) return;
      try {
        await cfg.api.excluir(item.id);
        toast(`${cfg.singular[0].toUpperCase()}${cfg.singular.slice(1)} excluído`);
        desenhar(await cfg.api.listar());
      } catch (e) {
        mostrarErro(e);
      }
    }

    desenhar(await cfg.api.listar());
    return raiz;
  };
}

function formulario_(cfg) {
  return async ({ params }) => {
    const id = params[0] ? Number(params[0]) : null;
    const existente = id ? await cfg.api.buscar(id) : {};
    const form = formulario({
      campos: cfg.campos(),
      valores: existente,
      enviar: id ? 'Salvar alterações' : `Salvar ${cfg.singular}`,
      cancelar: `#/${cfg.rota}`,
      aoEnviar: async (dados) => {
        if (id) await cfg.api.atualizar(id, dados);
        else await cfg.api.criar(dados);
        toast(`${cfg.singular[0].toUpperCase()}${cfg.singular.slice(1)} salvo`);
        location.hash = `#/${cfg.rota}`;
      },
    });
    return h('div', null,
      cabecalho({
        titulo: id ? `Editar ${cfg.singular}` : cfg.novo,
        voltar: { href: `#/${cfg.rota}`, texto: `Voltar para ${cfg.titulo.toLowerCase()}` },
      }),
      h('section', { class: 'painel' }, h('div', { class: 'corpo' }, form)));
  };
}

export const listaClientes = lista(entidades.clientes);
export const formCliente = formulario_(entidades.clientes);
export const listaCategorias = lista(entidades.categorias);
export const formCategoria = formulario_(entidades.categorias);
export const listaTecnicos = lista(entidades.tecnicos);
export const formTecnico = formulario_(entidades.tecnicos);

export async function detalheCliente({ params }) {
  const id = Number(params[0]);
  const cliente = await api.clientes.buscar(id);
  const resultado = h('div');
  let pagina = 0;

  async function carregar() {
    try {
      const { content, page } = await api.clientes.chamados(id, { page: pagina, size: 10, sort: 'dataAbertura,desc' });
      trocar(resultado,
        content.length === 0
          ? vazio('Este cliente ainda não tem chamados', 'Abra um chamado para registrar o primeiro atendimento.',
            h('a', { class: 'botao', href: `#/chamados/novo?clienteId=${id}` }, 'Abrir chamado'))
          : tabelaChamados(content, { mostrarCliente: false }),
        content.length === 0 ? null : paginacao(page, (n) => { pagina = n; carregar(); }));
    } catch (e) { mostrarErro(e); }
  }
  carregar();

  return h('div', null,
    cabecalho({
      titulo: cliente.nome, sub: cliente.email,
      voltar: { href: '#/clientes', texto: 'Voltar para clientes' },
      acoes: [
        h('a', { class: 'botao sec', href: `#/clientes/${id}/editar` }, 'Editar cliente'),
        h('a', { class: 'botao', href: `#/chamados/novo?clienteId=${id}` }, 'Abrir chamado'),
      ],
    }),
    h('section', { class: 'painel', style: 'margin-bottom:20px' },
      h('h2', null, 'Contato'),
      h('div', { class: 'corpo' },
        h('dl', { class: 'dados' },
          h('dt', null, 'E-mail'), h('dd', null, cliente.email),
          h('dt', null, 'Telefone'), h('dd', null, cliente.telefone ?? h('span', { class: 'mudo' }, 'Não informado'))))),
    h('section', { class: 'painel' }, h('h2', null, 'Chamados do cliente'), resultado));
}
