import { http, HttpResponse } from "msw";
import type { Projeto, Incorporadora, DashboardMetricas, Notificacao, AuditoriaEntry } from "@/types";

const BASE = "";

const mockIncorporadora: Incorporadora = {
  id: "user-inc-1",
  cnpj: "12345678000195",
  razaoSocial: "Construtora Atlas Ltda",
  nomeResponsavel: "João Silva",
  cpfResponsavel: "12345678901",
  cargoResponsavel: "Diretor",
  email: "joao@atlas.com.br",
  telefone: "11999999999",
  emailConfirmado: true,
  criadoEm: "2026-06-01T10:00:00.000Z",
  atualizadoEm: "2026-06-10T10:00:00.000Z",
  descricao: "Construtora com 10 anos de experiência no mercado imobiliário paulistano.",
  historicoAnterior: "Três empreendimentos residenciais concluídos em SP.",
};

const mockAuditoria: AuditoriaEntry[] = [
  { projetoId: "proj-1", criadoEm: "2026-06-15T10:00:00.000Z", acao: "CRIADO", userId: "user-inc-1", userName: "Incorporadora", descricao: "Projeto criado como rascunho", statusNovo: "RASCUNHO" },
  { projetoId: "proj-1", criadoEm: "2026-06-16T14:30:00.000Z", acao: "SUBMETIDO", userId: "user-inc-1", userName: "Incorporadora", descricao: "Projeto submetido para análise", statusAnterior: "RASCUNHO", statusNovo: "SUBMETIDO" },
  { projetoId: "proj-1", criadoEm: "2026-06-17T09:15:00.000Z", acao: "ANALISE_INICIADA", userId: "admin-1", userName: "Felipe Analista", descricao: "Análise iniciada pelo analista", statusAnterior: "SUBMETIDO", statusNovo: "EM_ANALISE" },
];

const mockProjetos: Projeto[] = [
  {
    id: "proj-1",
    incorporadoraId: "user-inc-1",
    status: "EM_ANALISE",
    revisao: 1,
    nome: "Residencial Jardins",
    modelo: "VENDA",
    tipoImovel: "RESIDENCIAL",
    cidade: "São Paulo",
    estado: "SP",
    endereco: "Rua das Flores, 123 — Jardins",
    descricao: "Empreendimento residencial de alto padrão com 20 unidades no bairro Jardins. Projeto diferenciado com acabamento premium e localização privilegiada.",
    valorTotal: 8_000_000,
    valorCaptar: 3_000_000,
    prazoObra: 18,
    prazoRetorno: 24,
    rentabilidadeEstimada: 22.5,
    modeloRetorno: "SCP",
    planoSaida: "Distribuição proporcional do lucro após venda de todas as unidades",
    tipoOferta: "PUBLICA",
    analistaId: "admin-1",
    analistaNome: "Felipe Analista",
    criadoEm: "2026-06-15T10:00:00.000Z",
    atualizadoEm: "2026-06-17T09:15:00.000Z",
    submetidoEm: "2026-06-16T14:30:00.000Z",
    historico: mockAuditoria,
  },
  {
    id: "proj-2",
    incorporadoraId: "user-inc-1",
    status: "RASCUNHO",
    revisao: 1,
    nome: "Comercial Faria Lima",
    modelo: "VENDA",
    tipoImovel: "COMERCIAL",
    cidade: "São Paulo",
    estado: "SP",
    endereco: "Av. Faria Lima, 4500",
    descricao: "Salas comerciais de alto padrão na Faria Lima. Projeto moderno com infraestrutura completa para empresas de tecnologia.",
    criadoEm: "2026-07-01T10:00:00.000Z",
    atualizadoEm: "2026-07-01T10:00:00.000Z",
  },
  {
    id: "proj-3",
    incorporadoraId: "user-inc-1",
    status: "OFERTA_CRIADA",
    revisao: 1,
    nome: "Casa Verde Campinas",
    modelo: "VENDA",
    tipoImovel: "RESIDENCIAL",
    cidade: "Campinas",
    estado: "SP",
    endereco: "Rua Barão de Jaguara, 456",
    descricao: "Conjunto habitacional com 30 casas em Campinas. Projeto aprovado e oferta publicada na plataforma.",
    valorTotal: 5_000_000,
    valorCaptar: 2_000_000,
    prazoObra: 12,
    prazoRetorno: 18,
    rentabilidadeEstimada: 18.0,
    modeloRetorno: "SCP",
    tipoOferta: "PUBLICA",
    ofertaId: "offer_abc123",
    ofertaLink: "https://investir.atlashub.example/oferta/casa-verde-campinas",
    ofertaConfirmadaEm: "2026-05-20T10:00:00.000Z",
    criadoEm: "2026-04-10T10:00:00.000Z",
    atualizadoEm: "2026-05-20T10:00:00.000Z",
  },
];

const mockNotificacoes: Notificacao[] = [
  { userId: "user-inc-1", criadoEm: "2026-07-09T20:00:00.000Z", id: "n1", tipo: "ANALISE_INICIADA", titulo: "Análise iniciada", mensagem: "Um analista iniciou a revisão do projeto Residencial Jardins.", lida: false, projetoId: "proj-1", projetoNome: "Residencial Jardins" },
  { userId: "user-inc-1", criadoEm: "2026-07-08T14:00:00.000Z", id: "n2", tipo: "PROJETO_SUBMETIDO", titulo: "Projeto recebido", mensagem: "Seu projeto Residencial Jardins foi recebido.", lida: true, projetoId: "proj-1", projetoNome: "Residencial Jardins" },
];

const mockMetricas: DashboardMetricas = {
  metricas: {
    RASCUNHO: 1,
    SUBMETIDO: 2,
    EM_ANALISE: 3,
    AJUSTE_SOLICITADO: 1,
    REPROVADO: 0,
    APROVADO: 2,
    OFERTA_CRIADA: 4,
  },
  total: 13,
};

export const handlers = [
  http.get(`${BASE}/health`, () => HttpResponse.json({ status: "ok", timestamp: new Date().toISOString(), service: "atlas-hub-backend" })),

  http.get(`${BASE}/incorporadora/perfil`, () => HttpResponse.json(mockIncorporadora)),
  http.put(`${BASE}/incorporadora/perfil`, () => HttpResponse.json({ updated: true })),
  http.post(`${BASE}/incorporadora/documentos/pre-sign`, () => HttpResponse.json({ url: "https://example.s3.amazonaws.com/upload?presigned=1", location: "https://example.s3.amazonaws.com/doc.pdf" })),
  http.put("https://example.s3.amazonaws.com/upload", () => new HttpResponse(null, { status: 200 })),
  http.put("https://example.s3.amazonaws.com/upload*", () => new HttpResponse(null, { status: 200 })),

  http.get(`${BASE}/projetos`, () => HttpResponse.json({ items: mockProjetos, cursor: null, hasMore: false })),
  http.post(`${BASE}/projetos`, () => HttpResponse.json({ id: `proj-${Date.now()}` }, { status: 201 })),
  http.get(`${BASE}/projetos/:id`, ({ params }) => {
    const projeto = mockProjetos.find((p) => p.id === params["id"]);
    if (projeto === undefined) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(projeto);
  }),
  http.put(`${BASE}/projetos/:id`, () => HttpResponse.json({ updated: true })),
  http.post(`${BASE}/projetos/:id/submeter`, () => HttpResponse.json({ status: "SUBMETIDO" })),
  http.post(`${BASE}/projetos/:id/resubmeter`, () => HttpResponse.json({ status: "SUBMETIDO", revisao: 2 })),
  http.post(`${BASE}/projetos/:id/documentos/pre-sign`, () => HttpResponse.json({ url: "https://example.s3.amazonaws.com/upload?presigned=1", location: "https://example.s3.amazonaws.com/doc.pdf" })),
  http.post(`${BASE}/documentos/download-url`, () => HttpResponse.json({ url: "https://example.s3.amazonaws.com/doc.pdf?download=1" })),

  http.get(`${BASE}/notificacoes`, () => HttpResponse.json({ items: mockNotificacoes, naoLidas: mockNotificacoes.filter((n) => !n.lida).length })),
  http.put(`${BASE}/notificacoes/:id/lida`, () => HttpResponse.json({ updated: true })),

  http.get(`${BASE}/admin/dashboard/metricas`, () => HttpResponse.json(mockMetricas)),
  http.get(`${BASE}/admin/curadoria`, () => HttpResponse.json({ items: mockProjetos.filter((p) => ["SUBMETIDO", "EM_ANALISE", "AJUSTE_SOLICITADO"].includes(p.status)), cursor: null, hasMore: false })),
  http.post(`${BASE}/admin/curadoria/:id/iniciar`, () => HttpResponse.json({ status: "EM_ANALISE" })),
  http.get(`${BASE}/admin/curadoria/:id`, ({ params }) => {
    const projeto = mockProjetos.find((p) => p.id === params["id"]) ?? mockProjetos[0]!;
    return HttpResponse.json({ projeto, incorporadora: mockIncorporadora, scorecards: [], historico: mockAuditoria, notas: [] });
  }),
  http.put(`${BASE}/admin/curadoria/:id/scorecard`, () => HttpResponse.json({ saved: true, notaGeral: 7.8 })),
  http.post(`${BASE}/admin/curadoria/:id/ajuste`, () => HttpResponse.json({ status: "AJUSTE_SOLICITADO" })),
  http.post(`${BASE}/admin/curadoria/:id/reprovar`, () => HttpResponse.json({ status: "REPROVADO", notaGeral: 4.5 })),
  http.post(`${BASE}/admin/curadoria/:id/aprovar`, () => HttpResponse.json({ status: "APROVADO", notaGeral: 8.2 })),
  http.post(`${BASE}/admin/curadoria/:id/confirmar-publicacao`, () => HttpResponse.json({ status: "OFERTA_CRIADA", ofertaId: "offer_mock123", ofertaLink: "https://investir.atlashub.example/oferta/mock" })),
  http.post(`${BASE}/admin/curadoria/:id/notas`, () => HttpResponse.json({ projetoId: "proj-1", criadoEm: new Date().toISOString(), analistaId: "admin-1", analistaNome: "Felipe Analista", texto: "Nota salva" })),
  http.post(`${BASE}/admin/curadoria/:id/reatribuir`, () => HttpResponse.json({ updated: true })),

  http.get(`${BASE}/admin/historico`, () => HttpResponse.json({ items: mockProjetos.filter((p) => ["APROVADO", "OFERTA_CRIADA", "REPROVADO"].includes(p.status)), cursor: null, hasMore: false })),
  http.get(`${BASE}/admin/incorporadoras`, () => HttpResponse.json({ items: [mockIncorporadora] })),
  http.get(`${BASE}/admin/incorporadoras/:id`, () => HttpResponse.json({ incorporadora: mockIncorporadora, projetos: mockProjetos })),
  http.get(`${BASE}/admin/usuarios`, () => HttpResponse.json({ items: [] })),
  http.post(`${BASE}/admin/usuarios`, () => HttpResponse.json({ id: "admin-new" }, { status: 201 })),
  http.put(`${BASE}/admin/usuarios/:id/desativar`, () => HttpResponse.json({ updated: true })),
];
