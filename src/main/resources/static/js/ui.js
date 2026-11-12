import { ApiError } from './erro.js';

export const STATUS = {
  ABERTO: 'Aberto',
  EM_ATENDIMENTO: 'Em atendimento',
  AGUARDANDO_CLIENTE: 'Aguardando cliente',
  FECHADO: 'Fechado',
};
export const PRIORIDADE = { BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta', CRITICA: 'Crítica' };
export const PERFIL = { ADMIN: 'Administrador', TECNICO: 'Técnico' };

export const TRANSICOES = {
  ABERTO: ['EM_ATENDIMENTO', 'FECHADO'],
  EM_ATENDIMENTO: ['AGUARDANDO_CLIENTE', 'FECHADO'],
  AGUARDANDO_CLIENTE: ['EM_ATENDIMENTO', 'FECHADO'],
  FECHADO: [],
};

export function h(tag, attrs, ...filhos) {
  const el = document.createElement(tag);
  let valor;
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'value') valor = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  anexar(el, filhos);
  if (valor !== undefined) el.value = valor;
  return el;
}

export function trocar(pai, ...filhos) {
  pai.replaceChildren();
  anexar(pai, filhos);
}

function anexar(pai, filhos) {
  for (const f of filhos.flat(Infinity)) {
    if (f === null || f === undefined || f === false) continue;
    pai.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
}

export function dataHora(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function selo(tipo, valor, rotulos) {
  return h('span', { class: `selo selo-${valor}` }, rotulos[valor] ?? valor);
}

export const seloStatus = (v) => selo('status', v, STATUS);
export const seloPrioridade = (v) => selo('prioridade', v, PRIORIDADE);

export function toast(mensagem, tipo = 'ok') {
  const el = h('div', { class: `toast${tipo === 'erro' ? ' erro' : ''}`, role: tipo === 'erro' ? 'alert' : 'status' }, mensagem);
  document.getElementById('avisos').append(el);
  setTimeout(() => el.remove(), tipo === 'erro' ? 7000 : 3500);
}

export function mostrarErro(e) {
  toast(e instanceof ApiError ? e.message : 'Não foi possível concluir a operação. Tente novamente.', 'erro');
  if (!(e instanceof ApiError)) console.error(e);
}

export function confirmar({ titulo, mensagem, acao }) {
  const dlg = document.getElementById('confirmacao');
  document.getElementById('confirmacao-titulo').textContent = titulo;
  document.getElementById('confirmacao-texto').textContent = mensagem;
  document.getElementById('confirmacao-ok').textContent = acao;
  return new Promise((resolve) => {
    dlg.addEventListener('close', () => resolve(dlg.returnValue === 'sim'), { once: true });
    dlg.returnValue = 'nao';
    dlg.showModal();
  });
}

export function carregando(texto = 'Carregando…') {
  return h('p', { class: 'carregando', role: 'status' }, texto);
}

export function vazio(titulo, texto, acao) {
  return h('div', { class: 'vazio' }, h('h3', null, titulo), h('p', null, texto), acao);
}

export function cabecalho({ titulo, sub, acoes, voltar }) {
  return h('div', null,
    voltar ? h('a', { class: 'voltar', href: voltar.href }, `← ${voltar.texto}`) : null,
    h('div', { class: 'cabecalho' },
      h('div', null, h('h1', null, titulo), sub ? h('p', { class: 'sub' }, sub) : null),
      acoes ? h('div', { class: 'acoes' }, acoes) : null));
}

export function tabela(colunas, linhas, classeLinha) {
  return h('div', { class: 'rolagem' },
    h('table', null,
      h('thead', null, h('tr', null, colunas.map((c) => h('th', { class: c.classe }, c.titulo)))),
      h('tbody', null, linhas.map((item) =>
        h('tr', { class: classeLinha ? classeLinha(item) : null },
          colunas.map((c) => h('td', { class: c.classe }, c.render(item))))))));
}

export function paginacao(pagina, aoMudar) {
  const { number, size, totalElements, totalPages } = pagina;
  const de = totalElements === 0 ? 0 : number * size + 1;
  const ate = Math.min((number + 1) * size, totalElements);
  return h('div', { class: 'paginacao' },
    h('span', null, `Mostrando ${de}–${ate} de ${totalElements}`),
    h('div', { class: 'botoes' },
      h('button', { class: 'botao sec mini', type: 'button', disabled: number <= 0, onclick: () => aoMudar(number - 1) }, 'Anterior'),
      h('button', { class: 'botao sec mini', type: 'button', disabled: number + 1 >= totalPages, onclick: () => aoMudar(number + 1) }, 'Próxima')));
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function formulario({ campos, valores = {}, enviar, cancelar, aoEnviar, aoCancelar }) {
  const refs = {};
  const alerta = h('div', { class: 'alerta', role: 'alert', hidden: true });

  const blocos = campos.map((c) => {
    const id = `campo-${c.nome}`;
    const erro = h('span', { class: 'erro-campo', id: `${id}-erro` });
    let entrada;
    const comum = {
      id, name: c.nome, required: c.obrigatorio, maxlength: c.max, placeholder: c.exemplo,
      'aria-describedby': `${id}-erro`,
    };
    if (c.tipo === 'select') {
      entrada = h('select', { ...comum, value: valores[c.nome] ?? '' },
        h('option', { value: '' }, c.vazio ?? 'Selecione'),
        c.opcoes.map((o) => h('option', { value: o.valor }, o.rotulo)));
    } else if (c.tipo === 'textarea') {
      entrada = h('textarea', { ...comum, value: valores[c.nome] ?? '' });
    } else {
      entrada = h('input', { ...comum, type: c.tipo ?? 'text', value: valores[c.nome] ?? '' });
    }
    refs[c.nome] = { entrada, erro, campo: c };
    return h('div', { class: 'campo' },
      h('label', { for: id }, c.rotulo, c.obrigatorio ? '' : ' (opcional)'),
      entrada, erro);
  });

  function limpar() {
    alerta.hidden = true;
    for (const { entrada, erro } of Object.values(refs)) {
      entrada.removeAttribute('aria-invalid');
      erro.textContent = '';
    }
  }

  function marcar(nome, mensagem) {
    const r = refs[nome];
    if (!r) return false;
    r.entrada.setAttribute('aria-invalid', 'true');
    r.erro.textContent = mensagem;
    return true;
  }

  function validar(dados) {
    let primeiro = null;
    for (const [nome, { campo }] of Object.entries(refs)) {
      const v = dados[nome];
      let msg = '';
      if (campo.obrigatorio && (v === null || v === '')) msg = `${campo.rotulo} é ${campo.feminino ? 'obrigatória' : 'obrigatório'}`;
      else if (campo.max && typeof v === 'string' && v.length > campo.max) msg = `${campo.rotulo} deve ter no máximo ${campo.max} caracteres`;
      else if (campo.tipo === 'email' && v && !REGEX_EMAIL.test(v)) msg = 'E-mail inválido';
      if (msg) { marcar(nome, msg); primeiro ??= refs[nome].entrada; }
    }
    primeiro?.focus();
    return !primeiro;
  }

  function coletar() {
    const dados = {};
    for (const [nome, { entrada, campo }] of Object.entries(refs)) {
      const bruto = entrada.value.trim();
      if (bruto === '') dados[nome] = campo.obrigatorio ? '' : null;
      else dados[nome] = campo.numero ? Number(bruto) : bruto;
    }
    return dados;
  }

  const botaoEnviar = h('button', { class: 'botao', type: 'submit' }, enviar);
  const form = h('form', { class: 'cadastro', novalidate: true,
    onsubmit: async (ev) => {
      ev.preventDefault();
      limpar();
      const dados = coletar();
      if (!validar(dados)) return;
      botaoEnviar.disabled = true;
      try {
        await aoEnviar(dados);
      } catch (e) {
        if (!(e instanceof ApiError)) { mostrarErro(e); return; }
        let sobrou = e.detalhes.length === 0;
        for (const d of e.detalhes) {
          const i = d.indexOf(': ');
          if (!(i > 0 && marcar(d.slice(0, i), d.slice(i + 2)))) sobrou = true;
        }
        if (sobrou) { alerta.textContent = e.message; alerta.hidden = false; alerta.scrollIntoView({ block: 'nearest' }); }
        else Object.values(refs).find((r) => r.entrada.getAttribute('aria-invalid'))?.entrada.focus();
      } finally {
        botaoEnviar.disabled = false;
      }
    } },
    alerta, blocos,
    h('div', { class: 'botoes' }, botaoEnviar, h('a', { class: 'botao sec', href: cancelar, onclick: aoCancelar }, 'Cancelar')));
  return form;
}
