import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import AdminInvestidoresPage from "./index";
import { api } from "@/services/api";
import type { Investidor } from "@/types";

const investidor: Investidor = {
  id: "investidor-1",
  email: "investidor@atlas.com.br",
  nome: "Investidor Teste",
  telefone: "+5511999999999",
  marketingOptIn: true,
  termosAceitosEm: "2026-10-29T10:00:00.000Z",
  termosVersao: "2026-10-29",
  wantsOpportunityAlerts: true,
  interestUpdatedAt: "2026-10-30T10:00:00.000Z",
  criadoEm: "2026-10-29T10:00:00.000Z",
  atualizadoEm: "2026-10-30T10:00:00.000Z",
};

describe("AdminInvestidoresPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("abre a visão geral do investidor", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ items: [investidor], nextCursor: null, pageSize: 20 } as never);
    render(<AdminInvestidoresPage />);
    expect(await screen.findByText("Investidor Teste")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Ver visão geral de Investidor Teste/i }));
    expect(await screen.findByText("Visão geral do investidor")).toBeInTheDocument();
    expect(screen.getByText("Autorizou receber comunicações e novidades da Atlas.")).toBeInTheDocument();
    expect(screen.getByText(/Pediu para ser avisado/i)).toBeInTheDocument();
  });
});
