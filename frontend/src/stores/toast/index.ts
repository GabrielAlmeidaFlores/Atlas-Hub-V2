import { create } from "zustand";

export interface Toast {
  readonly id: string;
  readonly type: "success" | "error" | "warning" | "info";
  readonly title: string;
  readonly description?: string;
}

interface ToastState {
  readonly toasts: Toast[];
  readonly addToast: (toast: Omit<Toast, "id">) => void;
  readonly removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
