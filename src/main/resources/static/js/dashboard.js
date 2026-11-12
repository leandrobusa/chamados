import { api } from './api.js';
import { h, cabecalho, STATUS, PRIORIDADE } from './ui.js';

const COR_STATUS = {
  ABERTO: 'var(--st-aberto)', EM_ATENDIMENTO: 'var(--st-atendimento)',
  AGUARDANDO_CLIENTE: 'var(--st-aguardando)', FECHADO: 'var(--st-fechado)',
};
const COR_PRIORIDADE = {
  BAIXA: 'var(--pr-baixa)', MEDIA: 'var(--pr-media)', ALTA: 'var(--pr-alta)', CRITICA: 'var(--pr-critica)',
};

function ledger(titulo, contagens, rotulos, cores, total, filtro) {
  return h('section', { class: 'painel' },
    h('h2', null, titulo),
    h('ul', { class: 'livro' }, Object.keys(rotulos).map((chave) => {
      const n = contagens[chave] ?? 0;
      const pct = total === 0 ? 0 : Math.round((n / total) * 100);
      return h('li', null,
        h('a', { href: `#/chamados?${filtro}=${chave}`, title: `Ver chamados: ${rotulos[chave]}` },
          h('span', { class: 'rotulo' }, rotulos[chave]),
          h('span', { class: 'barra', role: 'img', 'aria-label': `${pct}% do total` },
            h('i', { style: `width:${pct}%; --c:${cores[chave]}` })),
          h('span', { class: 'qtd' }, n)));
    })));
}

export async function dashboard() {
  const r = await api.dashboard.resumo();
  const abertos = r.total - (r.porStatus.FECHADO ?? 0);
  return h('div', null,
    cabecalho({
      titulo: 'Dashboard',
      sub: r.total === 0
        ? 'Ainda não há chamados registrados.'
        : `${r.total} ${r.total === 1 ? 'chamado' : 'chamados'} no total, ${abertos} ainda em andamento.`,
      acoes: h('a', { class: 'botao', href: '#/chamados/novo' }, 'Abrir chamado'),
    }),
    h('div', { class: 'grade-resumo' },
      ledger('Por status', r.porStatus, STATUS, COR_STATUS, r.total, 'status'),
      ledger('Por prioridade', r.porPrioridade, PRIORIDADE, COR_PRIORIDADE, r.total, 'prioridade')));
}
