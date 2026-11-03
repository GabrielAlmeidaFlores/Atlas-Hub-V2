import { http, HttpResponse } from "msw";
import type { Investidor } from "@/types";

const store: Investidor[] = [
  {
    id: "investidor-mock-1",
    email: "investidor@atlashub.com",
    nome: "Investidor Mock",
    telefone: "+5511999999999",
    marketingOptIn: true,
    termosAceitosEm: "2026-10-29T10:00:00.000Z",
    termosVersao: "2026-10-29",
    wantsOpportunityAlerts: false,
    criadoEm: "2026-10-29T10:00:00.000Z",
    atualizadoEm: "2026-10-29T10:00:00.000Z",
  },
  {
    id: "investidor-mock-2",
    email: "mariana@example.com",
    nome: "Mariana Costa",
    telefone: "+5511888888888",
    marketingOptIn: false,
    termosAceitosEm: "2026-10-30T10:00:00.000Z",
    termosVersao: "2026-10-29",
    wantsOpportunityAlerts: true,
    interestUpdatedAt: "2026-10-30T12:00:00.000Z",
    criadoEm: "2026-10-30T10:00:00.000Z",
    atualizadoEm: "2026-10-30T12:00:00.000Z",
  },
];

function currentEmail(request: Request): string {
  return (request.headers.get("x-mock-user-email") ?? "investidor@atlashub.com").trim().toLowerCase();
}

function csvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export const investidoresHandlers = [
  http.get("/admin/investidores", ({ request }) => {
    const params = new URL(request.url).searchParams;
    const search = (params.get("search") ?? "").toLowerCase();
    const marketing = params.get("marketingOptIn");
    const alerts = params.get("wantsOpportunityAlerts");
    const filtered = store.filter((item) => {
      if (marketing !== null && String(item.marketingOptIn) !== marketing) return false;
      if (alerts !== null && String(item.wantsOpportunityAlerts) !== alerts) return false;
      return search.length === 0 || [item.nome, item.email, item.telefone ?? ""].some((value) => value.toLowerCase().includes(search));
    });
    const pageSize = Math.max(1, Number(params.get("pageSize") ?? "20"));
    const offset = Math.max(0, Number(params.get("cursor") ?? "0") || 0);
    const nextOffset = offset + pageSize;
    return HttpResponse.json({
      items: filtered.slice(offset, nextOffset),
      nextCursor: nextOffset < filtered.length ? String(nextOffset) : null,
      pageSize,
    });
  }),
  http.get("/admin/investidores/export", () => {
    const header = ["Nome", "E-mail", "Telefone", "Marketing", "Avisos"];
    const rows = store.map((item) => [item.nome, item.email, item.telefone ?? "", item.marketingOptIn ? "Sim" : "Não", item.wantsOpportunityAlerts ? "Sim" : "Não"].map(csvCell).join(","));
    return new HttpResponse([header.join(","), ...rows].join("\r\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="investidores.csv"' },
    });
  }),
  http.put("/investidor/perfil", async ({ request }) => {
    const body = await request.json() as { nome?: string; telefone?: string; marketingOptIn?: boolean; termosAceitosEm?: string; termosVersao?: string };
    const email = currentEmail(request);
    const now = new Date().toISOString();
    const current = store.find((item) => item.email === email);
    if (current === undefined) {
      store.push({
        id: crypto.randomUUID(), email, nome: body.nome ?? email, telefone: body.telefone,
        marketingOptIn: body.marketingOptIn === true, wantsOpportunityAlerts: false,
        termosAceitosEm: body.termosAceitosEm, termosVersao: body.termosVersao,
        criadoEm: now, atualizadoEm: now,
      });
    } else {
      current.nome = body.nome ?? current.nome;
      current.telefone = body.telefone ?? current.telefone;
      current.marketingOptIn = body.marketingOptIn === true;
      current.termosAceitosEm = body.termosAceitosEm ?? current.termosAceitosEm;
      current.termosVersao = body.termosVersao ?? current.termosVersao;
      current.atualizadoEm = now;
    }
    return HttpResponse.json({ updated: true });
  }),
  http.get("/investidor/interesse", ({ request }) => {
    const current = store.find((item) => item.email === currentEmail(request));
    return HttpResponse.json({ investidor: { wantsOpportunityAlerts: current?.wantsOpportunityAlerts ?? false, interestUpdatedAt: current?.interestUpdatedAt ?? null } });
  }),
  http.post("/investidor/interesse", async ({ request }) => {
    const body = await request.json() as { wantsOpportunityAlerts?: boolean };
    const email = currentEmail(request);
    const current = store.find((item) => item.email === email);
    const now = new Date().toISOString();
    if (current === undefined) {
      store.push({
        id: crypto.randomUUID(), email, nome: email, marketingOptIn: false,
        wantsOpportunityAlerts: body.wantsOpportunityAlerts === true,
        interestUpdatedAt: body.wantsOpportunityAlerts === true ? now : undefined,
        criadoEm: now, atualizadoEm: now,
      });
    } else {
      current.wantsOpportunityAlerts = body.wantsOpportunityAlerts === true;
      current.interestUpdatedAt = body.wantsOpportunityAlerts === true ? now : undefined;
      current.atualizadoEm = now;
    }
    return HttpResponse.json({ investidor: { wantsOpportunityAlerts: body.wantsOpportunityAlerts === true, interestUpdatedAt: body.wantsOpportunityAlerts === true ? now : null } });
  }),
];
