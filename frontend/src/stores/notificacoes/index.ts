import { create } from "zustand";
import type { Notificacao } from "@/types";

interface NotificacoesState {
  readonly items: Notificacao[];
  readonly naoLidas: number;
  readonly isLoading: boolean;
  readonly fetchNotificacoes: () => Promise<void>;
  readonly marcarLida: (criadoEm: string) => Promise<void>;
  readonly marcarTodas: () => Promise<void>;
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
      const items = (data.items ?? []).filter(
        (n) => typeof n.criadoEm === "string" && n.criadoEm.length > 0 && !Number.isNaN(Date.parse(n.criadoEm)),
      );
      set({ items, naoLidas: data.naoLidas ?? items.filter((n) => !n.lida).length, isLoading: false });
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

  marcarTodas: async () => {
    const unread = get().items.filter((n) => !n.lida);
    await Promise.all(unread.map((n) => get().marcarLida(n.criadoEm)));
  },
}));
