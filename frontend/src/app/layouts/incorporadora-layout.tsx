import { useState, type ReactNode, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Bell, User, LogOut, Plus, Menu, X } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useNotificacoesStore } from "@/stores/notificacoes";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/perfil", label: "Perfil", icon: User },
  { to: "/notificacoes", label: "Notificações", icon: Bell },
] as const;

function Sidebar({ onClose }: { readonly onClose?: () => void }): ReactNode {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const { naoLidas, fetchNotificacoes } = useNotificacoesStore();
  const navigate = useNavigate();

  useEffect(() => {
    void fetchNotificacoes();
  }, [fetchNotificacoes]);

  function handleLogout(): void {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <Logo size="sm" />
        {onClose !== undefined && (
          <button type="button" onClick={onClose} className="border border-border p-1.5 text-muted-foreground hover:bg-muted lg:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="px-3 pt-3">
        <NavLink
          to="/projetos/novo"
          onClick={onClose}
          className="btn btn-navy flex w-full items-center justify-center gap-2 text-[11px] uppercase tracking-wider"
        >
          <Plus className="h-4 w-4" />
          Novo Projeto
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Menu</p>
        <ul className="space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onClose}
                className={({ isActive }) => cn("nav-item", isActive && "nav-item-active")}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                {label === "Notificações" && naoLidas > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center bg-destructive px-1.5 text-[10px] font-bold text-white">
                    {naoLidas > 9 ? "9+" : String(naoLidas)}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 flex items-center gap-3 border border-border bg-muted px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-navy-200 bg-navy-50 text-[11px] font-bold text-navy">
            {user?.email.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">{user?.email}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Incorporadora</p>
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="nav-item w-full text-destructive hover:bg-status-danger-subtle hover:text-destructive">
          <LogOut className="h-4 w-4" />
          Sair da conta
        </button>
      </div>
    </div>
  );
}

export default function IncorporadoraLayout(): ReactNode {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border min-[1000px]:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 min-[1000px]:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-60 border-r border-sidebar-border bg-sidebar">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="border border-border p-1.5 text-muted-foreground hover:bg-muted min-[1000px]:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-status-success" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Online</span>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground sm:block">{user?.email}</span>
            <div className="flex h-7 w-7 items-center justify-center border border-navy-200 bg-navy-50 text-[11px] font-bold text-navy">
              {user?.email.charAt(0).toUpperCase() ?? "I"}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
