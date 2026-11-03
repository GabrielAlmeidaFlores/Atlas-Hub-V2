import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, test, vi } from "vitest";
import InvestidorProjetosPage from "./index";
import { api } from "@/services/api";

describe("InvestidorProjetosPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("registra interesse no empty state", async () => {
    vi.spyOn(api, "get").mockImplementation((path) => {
      if (path === "/investidor/interesse") return Promise.resolve({ investidor: { wantsOpportunityAlerts: false, interestUpdatedAt: null } } as never);
      return Promise.resolve({ items: [] } as never);
    });
    const post = vi.spyOn(api, "post").mockResolvedValue({} as never);
    render(
      <MemoryRouter>
        <InvestidorProjetosPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText("Novas oportunidades em análise")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Quero ser avisado/i }));
    await waitFor(() => expect(post).toHaveBeenCalledWith("/investidor/interesse", { wantsOpportunityAlerts: true }));
    expect(await screen.findByText(/Você será avisado quando uma oportunidade abrir/i)).toBeInTheDocument();
  });
});
