import { ApiError } from './erro.js';
import { h, trocar, carregando, vazio } from './ui.js';
import { dashboard } from './dashboard.js';
import { listaChamados, formChamado, detalheChamado } from './chamados.js';
import {
  listaClientes, formCliente, detalheCliente,
  listaCategorias, formCategoria, listaTecnicos, formTecnico,
} from './cadastros.js';

const rotas = [
  [/^\/dashboard$/, 'dashboard', 'Dashboard', dashboard],
  [/^\/chamados$/, 'chamados', 'Chamados', listaChamados],
  [/^\/chamados\/novo$/, 'chamados', 'Abrir chamado', formChamado],
  [/^\/chamados\/(\d+)\/editar$/, 'chamados', 'Editar chamado', formChamado],
  [/^\/chamados\/(\d+)$/, 'chamados', 'Chamado', detalheChamado],
  [/^\/clientes$/, 'clientes', 'Clientes', listaClientes],
  [/^\/clientes\/novo$/, 'clientes', 'Novo cliente', formCliente],
  [/^\/clientes\/(\d+)\/editar$/, 'clientes', 'Editar cliente', formCliente],
  [/^\/clientes\/(\d+)$/, 'clientes', 'Cliente', detalheCliente],
  [/^\/categorias$/, 'categorias', 'Categorias', listaCategorias],
  [/^\/categorias\/novo$/, 'categorias', 'Nova categoria', formCategoria],
  [/^\/categorias\/(\d+)\/editar$/, 'categorias', 'Editar categoria', formCategoria],
  [/^\/tecnicos$/, 'tecnicos', 'Técnicos', listaTecnicos],
  [/^\/tecnicos\/novo$/, 'tecnicos', 'Novo técnico', formTecnico],
  [/^\/tecnicos\/(\d+)\/editar$/, 'tecnicos', 'Editar técnico', formTecnico],
];

const conteudo = document.getElementById('conteudo');
let tentativa = 0;

function marcarMenu(secao) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === secao) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

async function navegar() {
  const minha = ++tentativa;
  const [caminho, texto = ''] = (location.hash.slice(1) || '/dashboard').split('?');
  const query = new URLSearchParams(texto);

  const rota = rotas.find(([regex]) => regex.test(caminho));
  if (!rota) {
    marcarMenu('');
    trocar(conteudo, vazio('Página não encontrada', 'O endereço não existe neste sistema.',
      h('a', { class: 'botao', href: '#/dashboard' }, 'Ir para o dashboard')));
    document.title = 'Página não encontrada · Chamados';
    return;
  }

  const [regex, secao, titulo, visao] = rota;
  marcarMenu(secao);
  document.title = `${titulo} · Chamados`;
  trocar(conteudo, carregando());

  try {
    const params = caminho.match(regex).slice(1);
    const tela = await visao({ params, query });
    if (minha !== tentativa) return;
    trocar(conteudo, tela);
    conteudo.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  } catch (e) {
    if (minha !== tentativa) return;
    const naoEncontrado = e instanceof ApiError && e.status === 404;
    trocar(conteudo, vazio(
      naoEncontrado ? 'Registro não encontrado' : 'Não foi possível carregar esta tela',
      e instanceof ApiError ? e.message : 'Verifique se o servidor está no ar e tente de novo.',
      naoEncontrado
        ? h('a', { class: 'botao', href: `#/${secao}` }, 'Voltar para a lista')
        : h('button', { class: 'botao', type: 'button', onclick: navegar }, 'Tentar de novo')));
    if (!(e instanceof ApiError)) console.error(e);
  }
}

window.addEventListener('hashchange', navegar);
navegar();
