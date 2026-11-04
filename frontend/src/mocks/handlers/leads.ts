import { http, HttpResponse } from "msw";

interface MockLead {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
  readonly whatsapp: string;
  readonly createdAt: string;
  qualification?: Record<string, unknown>;
}

const leads: MockLead[] = [];

export const leadsHandlers = [
  http.post("/publico/leads", async ({ request }) => {
    const body = await request.json() as { nome?: string; email?: string; whatsapp?: string };
    const existing = leads.find((lead) => lead.email === body.email?.trim().toLowerCase());
    const lead = existing ?? {
      id: `lead-${String(leads.length + 1)}`,
      nome: body.nome ?? "Lead",
      email: body.email ?? "",
      whatsapp: body.whatsapp ?? "",
      createdAt: new Date().toISOString(),
    };
    if (existing === undefined) leads.push(lead);
    return HttpResponse.json({ leadId: lead.id, qualificationToken: "mock-qualification-token" });
  }),
  http.put("/publico/leads/:leadId/qualificacao", async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const lead = leads.find((item) => item.id === params["leadId"]);
    if (lead === undefined) return HttpResponse.json({ message: "Lead não encontrado" }, { status: 404 });
    lead.qualification = body;
    return HttpResponse.json({ ok: true });
  }),
];
