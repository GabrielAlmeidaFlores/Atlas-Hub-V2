import { create } from "zustand";
import type { Notificacao } from "@/types";

interface NotificacoesState {
  readonly items: Notificacao[];
  readonly naoLidas: number;
  readonly isLoading: boolean;
  readonly fetchNotificacoes: () => Promise<void>;
  readonly marcarLida: (criadoEm: string) => Promise<void>;
}

export const useNotificacoesStore = create<NotificacoesState>((set, get) => ({
  items: [],
  naoLidas: 0,
  isLoading: false,

  fetchNotificacoes: async () => {
    set({ isLoading: true });
    try {
      const { api } = await import("@/services/api");
      const data = await api.get<{ items: Notificacao[]; naoLidas: number }>("/notificacoes");
      set({ items: data.items, naoLidas: data.naoLidas, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  marcarLida: async (criadoEm) => {
    try {
      const { api } = await import("@/services/api");
      await api.put(`/notificacoes/${encodeURIComponent(criadoEm)}/lida`, {});
      set((state) => ({
        items: state.items.map((n) =>
          n.criadoEm === criadoEm ? { ...n, lida: true } : n,
        ),
        naoLidas: Math.max(0, get().naoLidas - 1),
      }));
    } catch {
      /* silently fail */
    }
  },
}));
