import { mock } from './mock-api.js';
import { ApiError } from './erro.js';

export const USAR_MOCK = false;

async function http(metodo, caminho, corpo) {
  const opcoes = { method: metodo, headers: { Accept: 'application/json' } };
  if (corpo !== undefined) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(corpo);
  }
  let resposta;
  try {
    resposta = await fetch(caminho, opcoes);
  } catch {
    throw new ApiError(0, 'Não foi possível falar com o servidor. Verifique se ele está no ar.');
  }
  if (resposta.status === 204) return null;
  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : null;
  if (!resposta.ok) {
    throw new ApiError(resposta.status, dados?.erro ?? 'Erro inesperado', dados?.detalhes ?? []);
  }
  return dados;
}

function query(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') params.set(chave, valor);
  });
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}

async function integrar(comMock, metodo, caminho, corpo) {
  if (USAR_MOCK) return comMock();
  return http(metodo, caminho, corpo);
}

export const api = {
  clientes: {
    listar: () => integrar(() => mock.clientes.listar(), 'GET', '/clientes'),
    buscar: (id) => integrar(() => mock.clientes.buscar(id), 'GET', `/clientes/${id}`),
    criar: (dados) => integrar(() => mock.clientes.criar(dados), 'POST', '/clientes', dados),
    atualizar: (id, dados) => integrar(() => mock.clientes.atualizar(id, dados), 'PUT', `/clientes/${id}`, dados),
    excluir: (id) => integrar(() => mock.clientes.excluir(id), 'DELETE', `/clientes/${id}`),
    chamados: (id, { page, size, sort }) => integrar(() => mock.clientes.chamados(id, { page, size, sort }), 'GET', `/clientes/${id}/chamados${query({ page, size, sort })}`),
  },

  categorias: {
    listar: () => integrar(() => mock.categorias.listar(), 'GET', '/categorias'),
    buscar: (id) => integrar(() => mock.categorias.buscar(id), 'GET', `/categorias/${id}`),
    criar: (dados) => integrar(() => mock.categorias.criar(dados), 'POST', '/categorias', dados),
    atualizar: (id, dados) => integrar(() => mock.categorias.atualizar(id, dados), 'PUT', `/categorias/${id}`, dados),
    excluir: (id) => integrar(() => mock.categorias.excluir(id), 'DELETE', `/categorias/${id}`),
  },

  tecnicos: {
    listar: () => integrar(() => mock.tecnicos.listar(), 'GET', '/tecnicos'),
    buscar: (id) => integrar(() => mock.tecnicos.buscar(id), 'GET', `/tecnicos/${id}`),
    criar: (dados) => integrar(() => mock.tecnicos.criar(dados), 'POST', '/tecnicos', dados),
    atualizar: (id, dados) => integrar(() => mock.tecnicos.atualizar(id, dados), 'PUT', `/tecnicos/${id}`, dados),
    excluir: (id) => integrar(() => mock.tecnicos.excluir(id), 'DELETE', `/tecnicos/${id}`),
  },

  chamados: {
    listar: (filtros) => integrar(() => mock.chamados.listar(filtros), 'GET', `/chamados${query(filtros)}`),
    buscar: (id) => integrar(() => mock.chamados.buscar(id), 'GET', `/chamados/${id}`),
    criar: (dados) => integrar(() => mock.chamados.criar(dados), 'POST', '/chamados', dados),
    atualizar: (id, dados) => integrar(() => mock.chamados.atualizar(id, dados), 'PUT', `/chamados/${id}`, dados),
    excluir: (id) => integrar(() => mock.chamados.excluir(id), 'DELETE', `/chamados/${id}`),
    atribuir: (id, tecnicoId) => integrar(() => mock.chamados.atribuir(id, tecnicoId), 'PATCH', `/chamados/${id}/atribuir`, { tecnicoId }),
    alterarStatus: (id, status) => integrar(() => mock.chamados.alterarStatus(id, status), 'PATCH', `/chamados/${id}/status`, { status }),
  },

  comentarios: {
    criar: (chamadoId, dados) => integrar(() => mock.comentarios.criar(chamadoId, dados), 'POST', `/chamados/${chamadoId}/comentarios`, dados),
  },

  dashboard: {
    resumo: () => integrar(() => mock.dashboard.resumo(), 'GET', '/dashboard'),
  },
};
