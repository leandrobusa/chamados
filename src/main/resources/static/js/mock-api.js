import { ApiError } from './erro.js';

const espera = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const copia = (o) => JSON.parse(JSON.stringify(o));
const agora = (menosDias = 0) =>
  new Date(Date.now() - menosDia(menosDias) - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, -1);
function menosDia(d) { return d * 86400000; }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const db = {
  clientes: [], categorias: [], tecnicos: [], chamados: [], comentarios: [],
  seq: { clientes: 0, categorias: 0, tecnicos: 0, chamados: 0, comentarios: 0 },
};

function proximo(colecao) { return ++db.seq[colecao]; }

function falha(status, mensagem, detalhes = []) {
  throw new ApiError(status, mensagem, detalhes);
}

function validacao(checagens) {
  const detalhes = checagens.filter(Boolean);
  if (detalhes.length) falha(400, 'Dados inválidos', detalhes);
}

const vazioTexto = (v) => v === null || v === undefined || String(v).trim() === '';
const obrigatorio = (campo, rotulo, v) => (vazioTexto(v) ? `${campo}: ${rotulo} é obrigatório` : null);
const maximo = (campo, rotulo, v, n) =>
  (typeof v === 'string' && v.length > n ? `${campo}: ${rotulo} deve ter no máximo ${n} caracteres` : null);

function crud({ colecao, nome, feminino, unico, rotuloUnico, validar, emUso }) {
  const Nome = nome[0].toUpperCase() + nome.slice(1);
  const naoEncontrado = (id) => falha(404, `${Nome} ${id} ${feminino ? 'não encontrada' : 'não encontrado'}`);
  const buscarEntity = (id) => db[colecao].find((x) => x.id === Number(id)) ?? naoEncontrado(id);
  const duplicado = (dados, id) => db[colecao].some((x) => x.id !== id && x[unico] === dados[unico]);
  const mensagemDuplicado = (dados) => falha(409, `Já existe ${nome} com o ${rotuloUnico} ${dados[unico]}`);

  return {
    async listar() { await espera(); return copia(db[colecao]); },
    async buscar(id) { await espera(); return copia(buscarEntity(id)); },
    async criar(dados) {
      await espera();
      validar(dados);
      if (duplicado(dados, null)) mensagemDuplicado(dados);
      const novo = { id: proximo(colecao), ...dados };
      db[colecao].push(novo);
      return copia(novo);
    },
    async atualizar(id, dados) {
      await espera();
      validar(dados);
      const atual = buscarEntity(id);
      if (duplicado(dados, atual.id)) mensagemDuplicado(dados);
      Object.assign(atual, dados);
      return copia(atual);
    },
    async excluir(id) {
      await espera();
      const atual = buscarEntity(id);
      if (emUso(atual.id)) falha(409, 'Operação viola uma restrição de integridade dos dados');
      db[colecao] = db[colecao].filter((x) => x.id !== atual.id);
    },
  };
}

const clientes = crud({
  colecao: 'clientes', nome: 'cliente', feminino: false, unico: 'email', rotuloUnico: 'e-mail',
  validar: (d) => validacao([
    obrigatorio('nome', 'Nome', d.nome), maximo('nome', 'Nome', d.nome, 100),
    obrigatorio('email', 'E-mail', d.email),
    !vazioTexto(d.email) && !EMAIL.test(d.email) ? 'email: E-mail inválido' : null,
    maximo('telefone', 'Telefone', d.telefone, 20),
  ]),
  emUso: (id) => db.chamados.some((c) => c.clienteId === id),
});

const categorias = crud({
  colecao: 'categorias', nome: 'categoria', feminino: true, unico: 'nome', rotuloUnico: 'nome',
  validar: (d) => validacao([
    obrigatorio('nome', 'Nome', d.nome), maximo('nome', 'Nome', d.nome, 100),
    maximo('descricao', 'Descrição', d.descricao, 255),
  ]),
  emUso: (id) => db.chamados.some((c) => c.categoriaId === id),
});

const tecnicos = crud({
  colecao: 'tecnicos', nome: 'técnico', feminino: false, unico: 'email', rotuloUnico: 'e-mail',
  validar: (d) => validacao([
    obrigatorio('nome', 'Nome', d.nome), maximo('nome', 'Nome', d.nome, 100),
    obrigatorio('email', 'E-mail', d.email),
    !vazioTexto(d.email) && !EMAIL.test(d.email) ? 'email: E-mail inválido' : null,
    maximo('email', 'E-mail', d.email, 120),
    vazioTexto(d.perfil) ? 'perfil: Perfil é obrigatório' : null,
  ]),
  emUso: (id) => db.chamados.some((c) => c.tecnicoId === id),
});

const TRANSICOES = {
  ABERTO: ['EM_ATENDIMENTO', 'FECHADO'],
  EM_ATENDIMENTO: ['AGUARDANDO_CLIENTE', 'FECHADO'],
  AGUARDANDO_CLIENTE: ['EM_ATENDIMENTO', 'FECHADO'],
  FECHADO: [],
};

function buscarChamado(id) {
  return db.chamados.find((c) => c.id === Number(id)) ?? falha(404, `Chamado ${id} não encontrado`);
}
function buscarPor(colecao, rotulo, feminino, id) {
  return db[colecao].find((x) => x.id === Number(id)) ?? falha(404, `${rotulo} ${id} ${feminino ? 'não encontrada' : 'não encontrado'}`);
}
function naoFechado(c) {
  if (c.status === 'FECHADO') falha(409, `Chamado ${c.id} está fechado e não pode ser alterado`);
}

function resposta(c) {
  const cliente = db.clientes.find((x) => x.id === c.clienteId);
  const categoria = db.categorias.find((x) => x.id === c.categoriaId);
  const tecnico = db.tecnicos.find((x) => x.id === c.tecnicoId);
  const { ...base } = c;
  return {
    ...base,
    clienteNome: cliente?.nome ?? null,
    categoriaNome: categoria?.nome ?? null,
    tecnicoId: tecnico?.id ?? null,
    tecnicoNome: tecnico?.nome ?? null,
  };
}

function validarChamado(d) {
  validacao([
    obrigatorio('titulo', 'Título', d.titulo), maximo('titulo', 'Título', d.titulo, 150),
    maximo('descricao', 'Descrição', d.descricao, 2000),
    vazioTexto(d.prioridade) ? 'prioridade: Prioridade é obrigatória' : null,
    vazioTexto(d.clienteId) ? 'clienteId: Cliente é obrigatório' : null,
    vazioTexto(d.categoriaId) ? 'categoriaId: Categoria é obrigatória' : null,
  ]);
}

function pagina(itens, { page = 0, size = 10 }) {
  const totalElements = itens.length;
  return {
    content: copia(itens.slice(page * size, page * size + size)),
    page: { size, number: page, totalElements, totalPages: Math.max(1, Math.ceil(totalElements / size)) },
  };
}

function listarChamados({ status, prioridade, clienteId, page = 0, size = 10, sort = 'dataAbertura,desc' } = {}) {
  const [campo, sentido] = sort.split(',');
  const fator = sentido === 'asc' ? 1 : -1;
  const itens = db.chamados
    .filter((c) => (!status || c.status === status)
      && (!prioridade || c.prioridade === prioridade)
      && (!clienteId || c.clienteId === Number(clienteId)))
    .map(resposta)
    .sort((a, b) => (a[campo] > b[campo] ? 1 : a[campo] < b[campo] ? -1 : 0) * fator || b.id - a.id);
  return pagina(itens, { page, size });
}

const chamados = {
  async listar(filtros) { await espera(); return listarChamados(filtros); },
  async buscar(id) {
    await espera();
    const c = buscarChamado(id);
    const lista = db.comentarios.filter((x) => x.chamadoId === c.id).sort((a, b) => (a.data > b.data ? 1 : -1));
    return copia({ ...resposta(c), comentarios: lista });
  },
  async criar(d) {
    await espera();
    validarChamado(d);
    buscarPor('clientes', 'Cliente', false, d.clienteId);
    buscarPor('categorias', 'Categoria', true, d.categoriaId);
    const novo = {
      id: proximo('chamados'), titulo: d.titulo, descricao: d.descricao, dataAbertura: agora(), dataFechamento: null,
      prioridade: d.prioridade, status: 'ABERTO', clienteId: Number(d.clienteId), categoriaId: Number(d.categoriaId), tecnicoId: null,
    };
    db.chamados.push(novo);
    return copia(resposta(novo));
  },
  async atualizar(id, d) {
    await espera();
    validarChamado(d);
    const c = buscarChamado(id);
    naoFechado(c);
    buscarPor('clientes', 'Cliente', false, d.clienteId);
    buscarPor('categorias', 'Categoria', true, d.categoriaId);
    Object.assign(c, {
      titulo: d.titulo, descricao: d.descricao, prioridade: d.prioridade,
      clienteId: Number(d.clienteId), categoriaId: Number(d.categoriaId),
    });
    return copia(resposta(c));
  },
  async excluir(id) {
    await espera();
    const c = buscarChamado(id);
    db.comentarios = db.comentarios.filter((x) => x.chamadoId !== c.id);
    db.chamados = db.chamados.filter((x) => x.id !== c.id);
  },
  async atribuir(id, tecnicoId) {
    await espera();
    validacao([vazioTexto(tecnicoId) ? 'tecnicoId: Técnico é obrigatório' : null]);
    const c = buscarChamado(id);
    naoFechado(c);
    const t = buscarPor('tecnicos', 'Técnico', false, tecnicoId);
    c.tecnicoId = t.id;
    return copia(resposta(c));
  },
  async alterarStatus(id, status) {
    await espera();
    validacao([vazioTexto(status) ? 'status: Status é obrigatório' : null]);
    const c = buscarChamado(id);
    naoFechado(c);
    if (!TRANSICOES[c.status].includes(status)) {
      falha(409, `Transição de status inválida: ${c.status} -> ${status}`);
    }
    c.status = status;
    if (status === 'FECHADO') c.dataFechamento = agora();
    return copia(resposta(c));
  },
};

const comentarios = {
  async criar(chamadoId, d) {
    await espera();
    validacao([
      obrigatorio('texto', 'Texto', d.texto), maximo('texto', 'Texto', d.texto, 2000),
      obrigatorio('autor', 'Autor', d.autor), maximo('autor', 'Autor', d.autor, 100),
    ]);
    const c = buscarChamado(chamadoId);
    const novo = { id: proximo('comentarios'), texto: d.texto, data: agora(), autor: d.autor, chamadoId: c.id };
    db.comentarios.push(novo);
    return copia(novo);
  },
};

const dashboard = {
  async resumo() {
    await espera();
    const porStatus = { ABERTO: 0, EM_ATENDIMENTO: 0, AGUARDANDO_CLIENTE: 0, FECHADO: 0 };
    const porPrioridade = { BAIXA: 0, MEDIA: 0, ALTA: 0, CRITICA: 0 };
    for (const c of db.chamados) { porStatus[c.status]++; porPrioridade[c.prioridade]++; }
    return { total: db.chamados.length, porStatus, porPrioridade };
  },
};

function semear() {
  const cli = [
    ['Ana Souza', 'ana@exemplo.com', '47999999999'],
    ['João Silva', 'joao@exemplo.com', '47988888888'],
    ['Beatriz Lima', 'beatriz@exemplo.com', null],
  ];
  cli.forEach(([nome, email, telefone]) => db.clientes.push({ id: proximo('clientes'), nome, email, telefone }));
  [['Hardware', 'Problemas com equipamentos'], ['Software', 'Problemas com sistemas e aplicativos'], ['Rede', 'Problemas de conectividade']]
    .forEach(([nome, descricao]) => db.categorias.push({ id: proximo('categorias'), nome, descricao }));
  [['Carlos Admin', 'carlos@exemplo.com', 'ADMIN'], ['Marta Técnica', 'marta@exemplo.com', 'TECNICO']]
    .forEach(([nome, email, perfil]) => db.tecnicos.push({ id: proximo('tecnicos'), nome, email, perfil }));

  const modelos = [
    ['Computador não liga', 'O computador não dá sinal de vídeo depois da queda de energia.', 'ALTA', 'ABERTO', 1, 1, null],
    ['Erro ao abrir o sistema', 'O sistema fecha logo após o login.', 'CRITICA', 'EM_ATENDIMENTO', 2, 2, 2],
    ['Troca de mouse', 'Mouse com defeito no botão esquerdo.', 'BAIXA', 'FECHADO', 1, 1, 1],
    ['Wi-Fi cai toda hora', 'A conexão cai a cada 10 minutos na sala 3.', 'MEDIA', 'AGUARDANDO_CLIENTE', 3, 3, 2],
    ['Instalar pacote Office', 'Precisa do pacote em três máquinas novas.', 'BAIXA', 'ABERTO', 2, 2, null],
    ['Impressora sem toner', 'Impressora do financeiro acusa toner vazio.', 'MEDIA', 'ABERTO', 3, 1, null],
    ['VPN não conecta', 'Home office sem acesso à VPN desde ontem.', 'ALTA', 'EM_ATENDIMENTO', 1, 3, 1],
    ['Monitor piscando', 'Monitor pisca ao ligar o cabo HDMI.', 'BAIXA', 'FECHADO', 2, 1, 2],
    ['Senha bloqueada', 'Usuário bloqueado após várias tentativas.', 'ALTA', 'FECHADO', 3, 2, 1],
    ['Lentidão no servidor', 'Arquivos compartilhados abrem muito devagar.', 'CRITICA', 'ABERTO', 1, 3, null],
    ['Teclado com teclas travando', 'Várias teclas ficam presas.', 'BAIXA', 'ABERTO', 2, 1, null],
    ['Backup não finalizou', 'O backup noturno termina com erro.', 'MEDIA', 'EM_ATENDIMENTO', 3, 2, 2],
  ];
  modelos.forEach(([titulo, descricao, prioridade, status, clienteId, categoriaId, tecnicoId], i) => {
    db.chamados.push({
      id: proximo('chamados'), titulo, descricao, dataAbertura: agora(modelos.length - i),
      dataFechamento: status === 'FECHADO' ? agora(modelos.length - i - 1 < 0 ? 0 : modelos.length - i - 1) : null,
      prioridade, status, clienteId, categoriaId, tecnicoId,
    });
  });
  db.comentarios.push(
    { id: proximo('comentarios'), texto: 'Estou verificando o erro nos logs.', data: agora(1), autor: 'Marta Técnica', chamadoId: 2 },
    { id: proximo('comentarios'), texto: 'Aconteceu de novo hoje de manhã, logo depois do login.', data: agora(0), autor: 'João Silva', chamadoId: 2 },
    { id: proximo('comentarios'), texto: 'Mouse trocado e testado.', data: agora(9), autor: 'Carlos Admin', chamadoId: 3 },
  );
}

semear();

export const mock = {
  clientes: {
    ...clientes,
    async chamados(id, { page = 0, size = 10, sort = 'dataAbertura,desc' } = {}) {
      await espera();
      buscarPor('clientes', 'Cliente', false, id);
      return listarChamados({ clienteId: id, page, size, sort });
    },
  },
  categorias, tecnicos, chamados, comentarios, dashboard,
};
