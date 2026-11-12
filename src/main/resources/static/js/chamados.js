import { api } from './api.js';
import {
  h, trocar, cabecalho, tabela, vazio, formulario, confirmar, toast, mostrarErro, paginacao, dataHora,
  seloStatus, seloPrioridade, STATUS, PRIORIDADE, PERFIL, TRANSICOES,
} from './ui.js';

export function tabelaChamados(itens, { mostrarCliente = true } = {}) {
  const colunas = [
    { titulo: 'Chamado', render: (c) => h('div', null,
      h('a', { class: 'titulo-link', href: `#/chamados/${c.id}` }, c.titulo),
      h('div', { class: 'mudo' }, `#${c.id}`)) },
    mostrarCliente ? { titulo: 'Cliente', render: (c) => h('a', { href: `#/clientes/${c.clienteId}` }, c.clienteNome) } : null,
    { titulo: 'Categoria', render: (c) => c.categoriaNome },
    { titulo: 'Prioridade', render: (c) => seloPrioridade(c.prioridade) },
    { titulo: 'Status', render: (c) => seloStatus(c.status) },
    { titulo: 'Técnico', render: (c) => c.tecnicoNome ?? h('span', { class: 'mudo' }, 'Sem técnico') },
    { titulo: 'Aberto em', render: (c) => dataHora(c.dataAbertura) },
  ].filter(Boolean);
  return tabela(colunas, itens, (c) => `prio-${c.prioridade}`);
}

const ORDENACOES = [
  ['dataAbertura,desc', 'Mais recentes'],
  ['dataAbertura,asc', 'Mais antigos'],
  ['titulo,asc', 'Título (A–Z)'],
];

function filtro(rotulo, id, entrada) {
  return h('div', { class: 'campo' }, h('label', { for: id }, rotulo), entrada);
}

export async function listaChamados({ query }) {
  const clientes = await api.clientes.listar();
  const estado = {
    status: query.get('status') ?? '',
    prioridade: query.get('prioridade') ?? '',
    clienteId: query.get('clienteId') ?? '',
    sort: query.get('sort') ?? 'dataAbertura,desc',
    page: Number(query.get('page') ?? 0),
  };
  const resultado = h('div');
  let versao = 0;

  function sincronizarEndereco() {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(estado)) if (v !== '' && !(k === 'page' && v === 0)) p.set(k, v);
    const texto = p.toString();
    history.replaceState(null, '', `#/chamados${texto ? `?${texto}` : ''}`);
  }

  async function carregar() {
    const minha = ++versao;
    sincronizarEndereco();
    try {
      const pagina = await api.chamados.listar({
        status: estado.status || undefined,
        prioridade: estado.prioridade || undefined,
        clienteId: estado.clienteId ? Number(estado.clienteId) : undefined,
        sort: estado.sort, page: estado.page, size: 10,
      });
      if (minha !== versao) return;
      const { content, page } = pagina;
      if (content.length === 0 && page.number > 0) { estado.page = 0; return carregar(); }
      trocar(resultado,
        content.length === 0
          ? vazio('Nenhum chamado encontrado', 'Ajuste os filtros ou abra um novo chamado.',
            h('a', { class: 'botao', href: '#/chamados/novo' }, 'Abrir chamado'))
          : tabelaChamados(content),
        content.length === 0 ? null : paginacao(page, (n) => { estado.page = n; carregar(); }));
    } catch (e) {
      if (minha === versao) { trocar(resultado, vazio('Não foi possível carregar os chamados', e.message)); mostrarErro(e); }
    }
  }

  function mudar(campo) {
    return (ev) => { estado[campo] = ev.target.value; estado.page = 0; carregar(); };
  }

  const selectStatus = h('select', { id: 'f-status', value: estado.status, onchange: mudar('status') },
    h('option', { value: '' }, 'Todos'), Object.entries(STATUS).map(([v, r]) => h('option', { value: v }, r)));
  const selectPrioridade = h('select', { id: 'f-prioridade', value: estado.prioridade, onchange: mudar('prioridade') },
    h('option', { value: '' }, 'Todas'), Object.entries(PRIORIDADE).map(([v, r]) => h('option', { value: v }, r)));
  const selectCliente = h('select', { id: 'f-cliente', value: estado.clienteId, onchange: mudar('clienteId') },
    h('option', { value: '' }, 'Todos'), clientes.map((c) => h('option', { value: c.id }, c.nome)));
  const selectOrdem = h('select', { id: 'f-ordem', value: estado.sort, onchange: mudar('sort') },
    ORDENACOES.map(([v, r]) => h('option', { value: v }, r)));

  const raiz = h('div', null,
    cabecalho({
      titulo: 'Chamados', sub: 'Acompanhe e filtre os chamados abertos pelos clientes.',
      acoes: h('a', { class: 'botao', href: '#/chamados/novo' }, 'Abrir chamado'),
    }),
    h('section', { class: 'painel', 'aria-label': 'Lista de chamados' },
      h('div', { class: 'filtros' },
        filtro('Status', 'f-status', selectStatus),
        filtro('Prioridade', 'f-prioridade', selectPrioridade),
        filtro('Cliente', 'f-cliente', selectCliente),
        filtro('Ordenar por', 'f-ordem', selectOrdem),
        h('button', { class: 'botao sec', type: 'button', onclick: () => {
          Object.assign(estado, { status: '', prioridade: '', clienteId: '', sort: 'dataAbertura,desc', page: 0 });
          selectStatus.value = selectPrioridade.value = selectCliente.value = '';
          selectOrdem.value = estado.sort;
          carregar();
        } }, 'Limpar filtros')),
      resultado));
  resultado.append(h('p', { class: 'carregando', role: 'status' }, 'Carregando…'));
  carregar();
  return raiz;
}

export async function formChamado({ params, query }) {
  const id = params[0] ? Number(params[0]) : null;
  const [clientes, categorias, existente] = await Promise.all([
    api.clientes.listar(), api.categorias.listar(), id ? api.chamados.buscar(id) : null,
  ]);
  const voltar = id ? { href: `#/chamados/${id}`, texto: 'Voltar ao chamado' } : { href: '#/chamados', texto: 'Voltar para chamados' };

  if (existente?.status === 'FECHADO') {
    return h('div', null,
      cabecalho({ titulo: 'Editar chamado', voltar }),
      h('div', { class: 'aviso' }, `O chamado #${id} está fechado e não pode mais ser alterado.`));
  }
  if (clientes.length === 0 || categorias.length === 0) {
    return h('div', null,
      cabecalho({ titulo: 'Abrir chamado', voltar }),
      h('section', { class: 'painel' }, vazio(
        'Faltam cadastros para abrir um chamado',
        'Todo chamado precisa de um cliente e de uma categoria.',
        h('a', { class: 'botao', href: clientes.length === 0 ? '#/clientes/novo' : '#/categorias/novo' },
          clientes.length === 0 ? 'Cadastrar cliente' : 'Cadastrar categoria'))));
  }

  const valores = existente ?? { clienteId: query.get('clienteId') ?? '' };
  const form = formulario({
    campos: [
      { nome: 'titulo', rotulo: 'Título', obrigatorio: true, max: 150, exemplo: 'Ex.: Computador não liga' },
      { nome: 'descricao', rotulo: 'Descrição', tipo: 'textarea', max: 2000, exemplo: 'Conte o que aconteceu e quando começou.' },
      { nome: 'prioridade', rotulo: 'Prioridade', tipo: 'select', obrigatorio: true, feminino: true,
        opcoes: Object.entries(PRIORIDADE).map(([valor, rotulo]) => ({ valor, rotulo })) },
      { nome: 'clienteId', rotulo: 'Cliente', tipo: 'select', obrigatorio: true, numero: true,
        opcoes: clientes.map((c) => ({ valor: c.id, rotulo: c.nome })) },
      { nome: 'categoriaId', rotulo: 'Categoria', tipo: 'select', obrigatorio: true, feminino: true, numero: true,
        opcoes: categorias.map((c) => ({ valor: c.id, rotulo: c.nome })) },
    ],
    valores,
    enviar: id ? 'Salvar alterações' : 'Abrir chamado',
    cancelar: voltar.href,
    aoEnviar: async (dados) => {
      const salvo = id ? await api.chamados.atualizar(id, dados) : await api.chamados.criar(dados);
      toast(id ? 'Chamado atualizado' : 'Chamado aberto');
      location.hash = `#/chamados/${salvo.id}`;
    },
  });
  return h('div', null,
    cabecalho({ titulo: id ? `Editar chamado #${id}` : 'Abrir chamado', voltar }),
    h('section', { class: 'painel' }, h('div', { class: 'corpo' }, form)));
}

const ROTULO_ACAO = {
  EM_ATENDIMENTO: (atual) => (atual === 'ABERTO' ? 'Iniciar atendimento' : 'Retomar atendimento'),
  AGUARDANDO_CLIENTE: () => 'Aguardar cliente',
  FECHADO: () => 'Fechar chamado',
};

export async function detalheChamado({ params }) {
  const id = Number(params[0]);
  const tecnicos = await api.tecnicos.listar();
  const raiz = h('div');

  async function recarregar() {
    try {
      desenhar(await api.chamados.buscar(id));
    } catch (e) { mostrarErro(e); }
  }

  async function executar(acao, mensagem) {
    try {
      await acao();
      toast(mensagem);
      await recarregar();
    } catch (e) { mostrarErro(e); }
  }

  function desenhar(c) {
    const fechado = c.status === 'FECHADO';
    const seletorTecnico = h('select', { id: 'tecnico', value: c.tecnicoId ?? '' },
      h('option', { value: '' }, 'Selecione um técnico'),
      tecnicos.map((t) => h('option', { value: t.id }, `${t.nome} (${PERFIL[t.perfil]})`)));
    const autor = h('input', { id: 'autor', name: 'autor', maxlength: 100, required: true, value: lerAutor() });
    const texto = h('textarea', { id: 'texto', name: 'texto', maxlength: 2000, required: true });
    const erroComentario = h('div', { class: 'alerta', role: 'alert', hidden: true });

    const trilha = h('ol', { class: 'trilha', 'aria-label': 'Andamento do chamado' },
      Object.entries(STATUS).map(([valor, rotulo]) =>
        h('li', { style: `--c: var(--st-${{ ABERTO: 'aberto', EM_ATENDIMENTO: 'atendimento', AGUARDANDO_CLIENTE: 'aguardando', FECHADO: 'fechado' }[valor]})`,
          'aria-current': valor === c.status ? 'step' : null }, rotulo)));

    trocar(raiz,
      cabecalho({
        titulo: c.titulo, sub: `Chamado #${c.id}`, voltar: { href: '#/chamados', texto: 'Voltar para chamados' },
        acoes: [seloPrioridade(c.prioridade), seloStatus(c.status)],
      }),
      fechado ? h('div', { class: 'aviso' }, 'Este chamado está fechado e não pode mais ser alterado. Você ainda pode registrar comentários.') : null,
      h('div', { class: 'detalhe' },
        h('div', { class: 'coluna' },
          h('section', { class: 'painel' },
            h('h2', null, 'Andamento'),
            h('div', { class: 'corpo' }, trilha,
              h('p', { class: `descricao${c.descricao ? '' : ' mudo'}` }, c.descricao || 'Sem descrição.'))),
          h('section', { class: 'painel' },
            h('h2', null, `Comentários (${c.comentarios.length})`),
            h('div', { class: 'corpo' },
              c.comentarios.length === 0
                ? h('p', { class: 'mudo' }, 'Nenhum comentário ainda.')
                : h('ul', { class: 'comentarios' }, c.comentarios.map((m) =>
                  h('li', { class: 'comentario' },
                    h('div', { class: 'meta' }, h('strong', null, m.autor), ` · ${dataHora(m.data)}`),
                    h('p', null, m.texto)))),
              h('form', { class: 'comentar', novalidate: true,
                onsubmit: async (ev) => {
                  ev.preventDefault();
                  erroComentario.hidden = true;
                  if (!autor.value.trim() || !texto.value.trim()) {
                    erroComentario.textContent = 'Informe o autor e o texto do comentário.';
                    erroComentario.hidden = false;
                    return;
                  }
                  try {
                    await api.comentarios.criar(id, { autor: autor.value.trim(), texto: texto.value.trim() });
                    guardarAutor(autor.value.trim());
                    toast('Comentário registrado');
                    await recarregar();
                  } catch (e) {
                    erroComentario.textContent = e.message;
                    erroComentario.hidden = false;
                  }
                } },
                erroComentario,
                h('div', { class: 'campo' }, h('label', { for: 'autor' }, 'Seu nome'), autor),
                h('div', { class: 'campo' }, h('label', { for: 'texto' }, 'Novo comentário'), texto),
                h('div', null, h('button', { class: 'botao', type: 'submit' }, 'Registrar comentário')))))),
        h('div', { class: 'coluna' },
          h('section', { class: 'painel' },
            h('h2', null, 'Detalhes'),
            h('div', { class: 'corpo' },
              h('dl', { class: 'dados' },
                h('dt', null, 'Cliente'), h('dd', null, h('a', { href: `#/clientes/${c.clienteId}` }, c.clienteNome)),
                h('dt', null, 'Categoria'), h('dd', null, c.categoriaNome),
                h('dt', null, 'Técnico'), h('dd', null, c.tecnicoNome ?? h('span', { class: 'mudo' }, 'Sem técnico')),
                h('dt', null, 'Aberto em'), h('dd', null, dataHora(c.dataAbertura)),
                h('dt', null, 'Fechado em'), h('dd', null, dataHora(c.dataFechamento))))),
          fechado ? null : h('section', { class: 'painel' },
            h('h2', null, 'Ações'),
            h('div', { class: 'corpo' },
              h('div', { class: 'bloco' },
                h('h3', null, 'Alterar status'),
                h('div', { class: 'acoes-pilha' }, TRANSICOES[c.status].map((destino) =>
                  h('button', { class: destino === 'FECHADO' ? 'botao perigo' : 'botao sec', type: 'button',
                    onclick: async () => {
                      if (destino === 'FECHADO' && !(await confirmar({
                        titulo: 'Fechar este chamado?',
                        mensagem: 'Depois de fechado, o chamado não poderá mais ser alterado.',
                        acao: 'Fechar chamado',
                      }))) return;
                      executar(() => api.chamados.alterarStatus(id, destino), `Status alterado para ${STATUS[destino]}`);
                    } }, ROTULO_ACAO[destino](c.status))))),
              h('div', { class: 'bloco' },
                h('h3', null, 'Técnico responsável'),
                tecnicos.length === 0
                  ? h('p', { class: 'mudo' }, 'Nenhum técnico cadastrado. ', h('a', { href: '#/tecnicos/novo' }, 'Cadastrar técnico'))
                  : h('div', { class: 'atribuir' }, seletorTecnico,
                    h('button', { class: 'botao sec', type: 'button', onclick: () => {
                      if (!seletorTecnico.value) { toast('Selecione um técnico para atribuir', 'erro'); return; }
                      executar(() => api.chamados.atribuir(id, Number(seletorTecnico.value)), 'Técnico atribuído');
                    } }, c.tecnicoId ? 'Trocar técnico' : 'Atribuir técnico'))),
              h('div', { class: 'bloco' },
                h('div', { class: 'acoes-pilha' },
                  h('a', { class: 'botao sec', href: `#/chamados/${id}/editar` }, 'Editar chamado'))))),
          h('div', { class: 'acoes-pilha' },
            h('button', { class: 'botao perigo', type: 'button', onclick: async () => {
              if (!(await confirmar({
                titulo: 'Excluir este chamado?',
                mensagem: 'O chamado e todos os comentários serão removidos. Essa ação não pode ser desfeita.',
                acao: 'Excluir chamado',
              }))) return;
              try {
                await api.chamados.excluir(id);
                toast('Chamado excluído');
                location.hash = '#/chamados';
              } catch (e) { mostrarErro(e); }
            } }, 'Excluir chamado')))));
  }

  desenhar(await api.chamados.buscar(id));
  return raiz;
}

function lerAutor() {
  try { return sessionStorage.getItem('autor') ?? ''; } catch { return ''; }
}
function guardarAutor(valor) {
  try { sessionStorage.setItem('autor', valor); } catch { /* sem armazenamento disponível */ }
}
