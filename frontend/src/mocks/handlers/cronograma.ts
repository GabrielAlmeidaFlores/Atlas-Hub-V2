import { http, HttpResponse } from "msw";
import type {
  CronogramaDetalhe,
  CronogramaListaItem,
  EtapaCronograma,
  LancamentoObra,
  Projeto,
  SituacaoOrcamento,
  StatusEtapaObra,
} from "@/types";

const BASE = "*";

interface EtapaRaw {
  projetoId: string;
  etapaId: string;
  nome: string;
  ordem: number;
  inicioPrevisto: string;
  fimPrevisto: string;
  percentualExecucao: number;
  valorOrcado: number;
  criadoEm: string;
  atualizadoEm: string;
  inicioReal?: string;
  fimReal?: string;
}

const etapas: EtapaRaw[] = [
  {
    projetoId: "proj-3",
    etapaId: "etapa-fund",
    nome: "Fundação",
    ordem: 1,
    inicioPrevisto: "2026-10-01",
    fimPrevisto: "2026-10-20",
    inicioReal: "2026-10-03",
    percentualExecucao: 75,
    valorOrcado: 50_000,
    criadoEm: "2026-09-01T10:00:00.000Z",
    atualizadoEm: "2026-09-10T10:00:00.000Z",
  },
  {
    projetoId: "proj-3",
    etapaId: "etapa-estrutura",
    nome: "Estrutura",
    ordem: 2,
    inicioPrevisto: "2026-10-21",
    fimPrevisto: "2026-11-30",
    percentualExecucao: 10,
    valorOrcado: 80_000,
    criadoEm: "2026-09-01T10:00:00.000Z",
    atualizadoEm: "2026-09-10T10:00:00.000Z",
  },
];

const lancamentos: LancamentoObra[] = [
  {
    projetoId: "proj-3",
    lancamentoId: "lanc-1",
    etapaId: "etapa-fund",
    descricao: "Concreto usinado",
    valor: 49_000,
    dataLancamento: "2026-10-08",
    status: "CONFIRMADO",
    criadoPor: "user-inc-1",
    criadoEm: "2026-10-08T12:00:00.000Z",
    atualizadoEm: "2026-10-08T12:00:00.000Z",
  },
  {
    projetoId: "proj-3",
    lancamentoId: "lanc-2",
    etapaId: "etapa-estrutura",
    descricao: "Mão de obra da forma",
    valor: 92_000,
    dataLancamento: "2026-10-22",
    status: "CONFIRMADO",
    criadoPor: "user-inc-1",
    criadoEm: "2026-10-22T12:00:00.000Z",
    atualizadoEm: "2026-10-22T12:00:00.000Z",
  },
];

function hojeYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function ymdUtc(ymd: string): number {
  const [y, m, d] = ymd.split("-").map((part) => Number(part));
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function desvioDias(fimPrevisto: string, fimReal: string | undefined, hoje: string, concluida: boolean): number {
  if (fimReal !== undefined) {
    return Math.round((ymdUtc(fimReal) - ymdUtc(fimPrevisto)) / 86_400_000);
  }
  if (!concluida && fimPrevisto < hoje) {
    return Math.round((ymdUtc(hoje) - ymdUtc(fimPrevisto)) / 86_400_000);
  }
  return 0;
}

function statusEtapa(etapa: EtapaRaw, hoje: string): StatusEtapaObra {
  if (etapa.percentualExecucao >= 100 || etapa.fimReal !== undefined) return "CONCLUIDA";
  if (etapa.fimPrevisto < hoje) return "ATRASADA";
  if (etapa.inicioReal !== undefined || etapa.percentualExecucao > 0) return "EM_ANDAMENTO";
  return "PLANEJADA";
}

function situacao(orcado: number, realizado: number): SituacaoOrcamento {
  if (realizado <= 0) return "SEM_LANCAMENTO";
  if (realizado > orcado) return "ESTOURO";
  return "DENTRO";
}

function montar(projeto: Projeto, role: "owner" | "admin"): CronogramaDetalhe {
  const hoje = hojeYmd();
  const etapasProj = etapas.filter((e) => e.projetoId === projeto.id).sort((a, b) => a.ordem - b.ordem);
  const lancProj = lancamentos.filter((l) => l.projetoId === projeto.id);
  const ativos = lancProj.filter((l) => l.status === "CONFIRMADO");
  const realizadoPorEtapa = new Map<string, number>();
  for (const item of ativos) {
    realizadoPorEtapa.set(item.etapaId, (realizadoPorEtapa.get(item.etapaId) ?? 0) + item.valor);
  }
  const views: EtapaCronograma[] = etapasProj.map((etapa) => {
    const statusExibicao = statusEtapa(etapa, hoje);
    const valorRealizado = realizadoPorEtapa.get(etapa.etapaId) ?? 0;
    return {
      ...etapa,
      statusExibicao,
      desvioDias: desvioDias(etapa.fimPrevisto, etapa.fimReal, hoje, statusExibicao === "CONCLUIDA"),
      valorRealizado,
      saldo: Math.round((etapa.valorOrcado - valorRealizado) * 100) / 100,
      percentualRealizado: etapa.valorOrcado > 0 ? Math.round((valorRealizado / etapa.valorOrcado) * 1000) / 10 : 0,
      situacaoOrcamento: situacao(etapa.valorOrcado, valorRealizado),
    };
  });
  const valorOrcado = etapasProj.reduce((sum, e) => sum + e.valorOrcado, 0);
  const valorRealizado = ativos.reduce((sum, l) => sum + l.valor, 0);
  const percentualAvanco = etapasProj.length === 0
    ? 0
    : Math.round(etapasProj.reduce((sum, e) => sum + e.percentualExecucao, 0) / etapasProj.length);
  return {
    projeto: {
      id: projeto.id,
      nome: projeto.nome,
      status: projeto.status,
      cidade: projeto.cidade,
      estado: projeto.estado,
      ...(projeto.prazoObra !== undefined ? { prazoObra: projeto.prazoObra } : {}),
      ...(projeto.valorTotal !== undefined ? { valorTotal: projeto.valorTotal } : {}),
    },
    podeEditarEtapas: role === "owner",
    podeLancarGastos: role === "owner" && (projeto.status === "APROVADO" || projeto.status === "OFERTA_CRIADA"),
    resumo: {
      etapasConcluidas: views.filter((v) => v.statusExibicao === "CONCLUIDA").length,
      etapasAtrasadas: views.filter((v) => v.statusExibicao === "ATRASADA").length,
      percentualAvanco,
      valorOrcado,
      valorRealizado,
      saldo: Math.round((valorOrcado - valorRealizado) * 100) / 100,
      percentualRealizado: valorOrcado > 0 ? Math.round((valorRealizado / valorOrcado) * 1000) / 10 : 0,
      situacaoOrcamento: situacao(valorOrcado, valorRealizado),
    },
    etapas: views,
    lancamentos: [...lancProj].sort((a, b) => b.dataLancamento.localeCompare(a.dataLancamento) || b.criadoEm.localeCompare(a.criadoEm)),
  };
}

function findProjeto(projetos: readonly Projeto[], id: string): Projeto | undefined {
  return projetos.find((p) => p.id === id);
}

export function cronogramaHandlers(projetos: Projeto[]) {
  return [
    http.get(`${BASE}/projetos/:id/cronograma`, ({ params }) => {
      const projeto = findProjeto(projetos, String(params["id"]));
      if (projeto === undefined) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(montar(projeto, "owner"));
    }),
    http.post(`${BASE}/projetos/:id/cronograma/etapas`, async ({ params, request }) => {
      const projetoId = String(params["id"]);
      const body = (await request.json()) as Partial<EtapaRaw>;
      const now = new Date().toISOString();
      const etapa: EtapaRaw = {
        projetoId,
        etapaId: `etapa-${Date.now()}`,
        nome: body.nome ?? "Etapa",
        ordem: etapas.filter((e) => e.projetoId === projetoId).length + 1,
        inicioPrevisto: body.inicioPrevisto ?? hojeYmd(),
        fimPrevisto: body.fimPrevisto ?? hojeYmd(),
        percentualExecucao: body.percentualExecucao ?? 0,
        valorOrcado: body.valorOrcado ?? 0,
        criadoEm: now,
        atualizadoEm: now,
        ...(body.inicioReal !== undefined && body.inicioReal !== "" ? { inicioReal: body.inicioReal } : {}),
        ...(body.fimReal !== undefined && body.fimReal !== "" ? { fimReal: body.fimReal } : {}),
      };
      etapas.push(etapa);
      return HttpResponse.json(etapa, { status: 201 });
    }),
    http.put(`${BASE}/projetos/:id/cronograma/etapas/:etapaId`, async ({ params, request }) => {
      const etapaId = String(params["etapaId"]);
      const idx = etapas.findIndex((e) => e.etapaId === etapaId && e.projetoId === String(params["id"]));
      if (idx < 0) return new HttpResponse(null, { status: 404 });
      const body = (await request.json()) as Partial<EtapaRaw> & { inicioReal?: string; fimReal?: string };
      const current = etapas[idx];
      if (current === undefined) return new HttpResponse(null, { status: 404 });
      const inicioReal = body.inicioReal !== undefined
        ? (body.inicioReal === "" ? undefined : body.inicioReal)
        : current.inicioReal;
      const fimReal = body.fimReal !== undefined
        ? (body.fimReal === "" ? undefined : body.fimReal)
        : current.fimReal;
      const next: EtapaRaw = {
        projetoId: current.projetoId,
        etapaId: current.etapaId,
        nome: body.nome ?? current.nome,
        ordem: current.ordem,
        inicioPrevisto: body.inicioPrevisto ?? current.inicioPrevisto,
        fimPrevisto: body.fimPrevisto ?? current.fimPrevisto,
        percentualExecucao: body.percentualExecucao ?? current.percentualExecucao,
        valorOrcado: body.valorOrcado ?? current.valorOrcado,
        criadoEm: current.criadoEm,
        atualizadoEm: new Date().toISOString(),
        ...(inicioReal !== undefined ? { inicioReal } : {}),
        ...(fimReal !== undefined ? { fimReal } : {}),
      };
      etapas[idx] = next;
      return HttpResponse.json(next);
    }),
    http.delete(`${BASE}/projetos/:id/cronograma/etapas/:etapaId`, ({ params }) => {
      const etapaId = String(params["etapaId"]);
      const projetoId = String(params["id"]);
      const hasLanc = lancamentos.some((l) => l.etapaId === etapaId && l.status === "CONFIRMADO");
      if (hasLanc) {
        return HttpResponse.json({ code: "CONFLICT", message: "Não é possível excluir etapa com lançamentos confirmados" }, { status: 409 });
      }
      const idx = etapas.findIndex((e) => e.etapaId === etapaId && e.projetoId === projetoId);
      if (idx < 0) return new HttpResponse(null, { status: 404 });
      etapas.splice(idx, 1);
      return HttpResponse.json({ deleted: true });
    }),
    http.post(`${BASE}/projetos/:id/cronograma/lancamentos`, async ({ params, request }) => {
      const projeto = findProjeto(projetos, String(params["id"]));
      if (projeto === undefined) return new HttpResponse(null, { status: 404 });
      if (projeto.status !== "APROVADO" && projeto.status !== "OFERTA_CRIADA") {
        return HttpResponse.json({ code: "FORBIDDEN", message: "Acesso negado" }, { status: 403 });
      }
      const body = (await request.json()) as Partial<LancamentoObra>;
      if (body.etapaId === undefined || body.etapaId === "") {
        return HttpResponse.json({ code: "VALIDATION_ERROR", message: "Etapa obrigatória" }, { status: 400 });
      }
      const etapaExiste = etapas.some((e) => e.projetoId === projeto.id && e.etapaId === body.etapaId);
      if (!etapaExiste) {
        return HttpResponse.json({ code: "VALIDATION_ERROR", message: "Etapa informada não existe neste projeto" }, { status: 400 });
      }
      const now = new Date().toISOString();
      const item: LancamentoObra = {
        projetoId: projeto.id,
        lancamentoId: `lanc-${Date.now()}`,
        etapaId: body.etapaId,
        descricao: body.descricao ?? "Despesa",
        valor: body.valor ?? 0,
        dataLancamento: body.dataLancamento ?? hojeYmd(),
        status: "CONFIRMADO",
        criadoPor: "user-inc-1",
        criadoEm: now,
        atualizadoEm: now,
        ...(body.comprovanteUrl !== undefined ? { comprovanteUrl: body.comprovanteUrl } : {}),
      };
      lancamentos.push(item);
      return HttpResponse.json(item, { status: 201 });
    }),
    http.put(`${BASE}/projetos/:id/cronograma/lancamentos/:lancamentoId`, ({ params }) => {
      const lancamentoId = String(params["lancamentoId"]);
      const idx = lancamentos.findIndex((l) => l.lancamentoId === lancamentoId && l.projetoId === String(params["id"]));
      if (idx < 0) return new HttpResponse(null, { status: 404 });
      const current = lancamentos[idx];
      if (current === undefined) return new HttpResponse(null, { status: 404 });
      const next: LancamentoObra = { ...current, status: "CANCELADO", atualizadoEm: new Date().toISOString() };
      lancamentos[idx] = next;
      return HttpResponse.json(next);
    }),
    http.get(`${BASE}/admin/cronograma`, () => {
      const elegiveis = projetos.filter((p) => p.status === "APROVADO" || p.status === "OFERTA_CRIADA");
      const items: CronogramaListaItem[] = elegiveis.map((p) => {
        const d = montar(p, "admin");
        return {
          projetoId: p.id,
          nome: p.nome,
          cidade: p.cidade,
          estado: p.estado,
          status: p.status,
          etapas: d.etapas.length,
          ...d.resumo,
        };
      });
      return HttpResponse.json({ items });
    }),
    http.get(`${BASE}/admin/cronograma/projetos/:projetoId`, ({ params }) => {
      const projeto = findProjeto(projetos, String(params["projetoId"]));
      if (projeto === undefined) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(montar(projeto, "admin"));
    }),
  ];
}
