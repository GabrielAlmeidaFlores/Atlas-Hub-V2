import { useState, type ReactNode, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Bell, User, LogOut, Plus, Menu, X } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useNotificacoesStore } from "@/stores/notificacoes";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard",    label: "Dashboard",      icon: LayoutDashboard },
  { to: "/perfil",       label: "Perfil",          icon: User },
  { to: "/notificacoes", label: "Notificações",    icon: Bell },
] as const;

function Sidebar({ onClose }: { readonly onClose?: () => void }): ReactNode {
  const logout    = useAuthStore((s) => s.logout);
  const user      = useAuthStore((s) => s.user);
  const { naoLidas, fetchNotificacoes } = useNotificacoesStore();
  const navigate  = useNavigate();

  useEffect(() => { void fetchNotificacoes(); }, [fetchNotificacoes]);

  function handleLogout(): void { logout(); navigate("/login"); }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Logo row */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
        <Logo size="sm" />
        {onClose !== undefined && (
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* New project CTA */}
      <div className="px-3 pt-4">
        <NavLink
          to="/projetos/novo"
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
              isActive
                ? "bg-navy text-white shadow-navy-sm"
                : "bg-navy text-white shadow-navy-sm hover:bg-navy-light",
            )
          }
        >
          <Plus className="h-4 w-4" /> Novo Projeto
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Menu</p>
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
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {naoLidas > 9 ? "9+" : String(naoLidas)}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-slate-100 p-3">
        <div className="mb-1.5 flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-black text-white">
            {user?.email.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-900">{user?.email}</p>
            <p className="text-[10px] text-slate-400">Incorporadora</p>
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="nav-item w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="h-4 w-4" /> Sair da conta
        </button>
      </div>
    </div>
  );
}

export default function IncorporadoraLayout(): ReactNode {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F6FA]">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-100 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-2xl">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="flex h-14 items-center gap-3 border-b border-slate-100 bg-white px-4 lg:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
          <Logo size="sm" />
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
