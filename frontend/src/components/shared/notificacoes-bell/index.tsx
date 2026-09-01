import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { useNotificacoesStore } from "@/stores/notificacoes";
import { cn, timeAgo } from "@/lib/utils";

const PREVIEW_LIMIT = 7;

export function NotificacoesBell(): ReactNode {
  const { items, naoLidas, fetchNotificacoes, marcarLida, marcarTodas } = useNotificacoesStore();
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetchNotificacoes();
  }, [fetchNotificacoes]);

  useEffect(() => {
    if (!open) return;

    function placePanel(): void {
      const btn = buttonRef.current;
      if (btn === null) return;
      const rect = btn.getBoundingClientRect();
      setPanelStyle({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }

    placePanel();
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", placePanel, true);
    return () => {
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", placePanel, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const preview = [...items]
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .slice(0, PREVIEW_LIMIT);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative z-[60] flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors",
          "hover:text-navy",
          open && "text-navy",
        )}
        aria-label="Notificações"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" />
        {naoLidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center bg-destructive px-1 text-[10px] font-bold leading-none text-white">
            {naoLidas > 9 ? "9+" : String(naoLidas)}
          </span>
        )}
      </button>

      {open
        && createPortal(
          <div className="fixed inset-0 z-[100]">
            <button
              type="button"
              aria-label="Fechar notificações"
              className="absolute inset-0 bg-black/20"
              onClick={() => setOpen(false)}
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Notificações recentes"
              className="absolute w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-[12px] border border-border bg-card shadow-[0_16px_40px_rgb(15_23_42/0.18)]"
              style={{ top: panelStyle.top, right: panelStyle.right }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">Notificações</p>
                {naoLidas > 0 && (
                  <button
                    type="button"
                    onClick={() => void marcarTodas()}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-navy hover:underline"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Marcar todas como lido
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {preview.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhuma notificação
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {preview.map((notif) => (
                      <li key={notif.criadoEm}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!notif.lida) void marcarLida(notif.criadoEm);
                          }}
                          className={cn(
                            "w-full px-4 py-3 text-left transition-colors hover:bg-muted/60",
                            !notif.lida && "bg-navy-50/60",
                          )}
                        >
                          <p className={cn("text-sm text-foreground", !notif.lida ? "font-semibold" : "font-medium")}>
                            {notif.titulo}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {notif.mensagem}
                          </p>
                          <p className="mt-1.5 text-[11px] text-muted-foreground">{timeAgo(notif.criadoEm)}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-border p-2">
                <Link
                  to="/notificacoes"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-navy transition-colors hover:bg-navy-50"
                >
                  Abrir todas
                </Link>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
