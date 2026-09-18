import { setupServer } from "msw/node";
import { handlers } from "../src/mocks/handlers/index.ts";

const ORIGIN = "http://localhost:5180";
const cases: Array<{ name: string; ok: boolean; detail: string }> = [];
function check(name: string, ok: boolean, detail = ""): void {
  cases.push({ name, ok, detail });
  process.stdout.write(`${ok ? "PASS" : "FAIL"}  ${name}${detail !== "" ? ` — ${detail}` : ""}\n`);
}

const server = setupServer(...handlers);
server.listen({ onUnhandledRequest: "bypass" });

try {
  const lista = await fetch(`${ORIGIN}/admin/cronograma`);
  const listaBody = (await lista.json()) as { items: Array<{ projetoId: string; nome: string; valorOrcado: number; valorRealizado: number; situacaoOrcamento: string }> };
  check("GET admin lista 200", lista.status === 200);
  const casa = listaBody.items.find((i) => i.projetoId === "proj-3");
  check("Casa Verde na lista admin", casa !== undefined, casa?.nome ?? "");
  check("lista: orçado 130000", casa?.valorOrcado === 130_000);
  check("lista: realizado 141000", casa?.valorRealizado === 141_000);
  check("lista: ESTOURO", casa?.situacaoOrcamento === "ESTOURO");
  check("rascunho fora da lista", !listaBody.items.some((i) => i.projetoId === "proj-2"));

  const owner = await fetch(`${ORIGIN}/projetos/proj-3/cronograma`);
  const d = (await owner.json()) as {
    podeEditarEtapas: boolean;
    podeLancarGastos: boolean;
    etapas: Array<{ nome: string; valorOrcado: number; valorRealizado: number; saldo: number; inicioPrevisto: string; fimPrevisto: string; percentualExecucao: number }>;
    lancamentos: Array<{ etapaId: string }>;
    centrosCusto?: unknown;
  };
  check("GET owner 200", owner.status === 200);
  check("owner edita etapas", d.podeEditarEtapas === true);
  check("owner lança gastos (OFERTA_CRIADA)", d.podeLancarGastos === true);
  const fund = d.etapas.find((e) => e.nome === "Fundação");
  check("obra: fundação tem prazo previsto", fund?.inicioPrevisto === "2026-10-01" && fund.fimPrevisto === "2026-10-20");
  check("obra: fundação tem % físico", fund?.percentualExecucao === 75);
  check("financeiro: orçado 50000 realizado 49000", fund?.valorOrcado === 50_000 && fund.valorRealizado === 49_000);
  check("financeiro: saldo 1000", fund?.saldo === 1_000);
  check("sem centro de custo no payload", d.centrosCusto === undefined);

  const admin = await fetch(`${ORIGIN}/admin/cronograma/projetos/proj-3`);
  const ad = (await admin.json()) as { podeEditarEtapas: boolean; podeLancarGastos: boolean };
  check("admin detalhe 200", admin.status === 200);
  check("admin não edita", ad.podeEditarEtapas === false);
  check("admin não lança", ad.podeLancarGastos === false);

  const rascunho = await fetch(`${ORIGIN}/projetos/proj-2/cronograma`);
  const r = (await rascunho.json()) as { podeLancarGastos: boolean };
  check("rascunho não lança gasto", r.podeLancarGastos === false);

  const gastoBloqueado = await fetch(`${ORIGIN}/projetos/proj-2/cronograma/lancamentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ etapaId: "x", descricao: "x", valor: 1, dataLancamento: "2026-09-18" }),
  });
  check("POST gasto em rascunho 403", gastoBloqueado.status === 403);

  const nova = await fetch(`${ORIGIN}/projetos/proj-3/cronograma/etapas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: "Acabamento reteste",
      inicioPrevisto: "2026-12-01",
      fimPrevisto: "2026-12-20",
      valorOrcado: 15_000,
    }),
  });
  const etapa = (await nova.json()) as { etapaId: string };
  check("POST etapa 201", nova.status === 201);

  const gasto = await fetch(`${ORIGIN}/projetos/proj-3/cronograma/lancamentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      etapaId: etapa.etapaId,
      descricao: "Tinta reteste",
      valor: 2_000,
      dataLancamento: "2026-12-03",
    }),
  });
  const lanc = (await gasto.json()) as { lancamentoId: string };
  check("POST gasto 201", gasto.status === 201);

  const conflito = await fetch(`${ORIGIN}/projetos/proj-3/cronograma/etapas/${etapa.etapaId}`, { method: "DELETE" });
  check("DELETE etapa com gasto 409", conflito.status === 409);

  const cancel = await fetch(`${ORIGIN}/projetos/proj-3/cronograma/lancamentos/${lanc.lancamentoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "CANCELADO" }),
  });
  check("PUT cancelar 200", cancel.status === 200);

  const del = await fetch(`${ORIGIN}/projetos/proj-3/cronograma/etapas/${etapa.etapaId}`, { method: "DELETE" });
  check("DELETE etapa após cancelar 200", del.status === 200);
} finally {
  server.close();
}

const failed = cases.filter((c) => !c.ok);
process.stdout.write(`\nMSW ${String(cases.length - failed.length)}/${String(cases.length)}\n`);
process.stdout.write(`JSON_MSW ${JSON.stringify(cases)}\n`);
if (failed.length > 0) process.exitCode = 1;
