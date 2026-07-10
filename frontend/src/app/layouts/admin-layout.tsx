import { useState, type ReactNode } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, History, Building2, Users, LogOut, Menu, X, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

function Sidebar({ onClose }: { readonly onClose?: () => void }): ReactNode {
  const logout   = useAuthStore((s) => s.logout);
  const user     = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  function handleLogout(): void { logout(); navigate("/login"); }

  const navItems = [
    { to: "/admin",                label: "Dashboard",         icon: LayoutDashboard, end: true  },
    { to: "/admin/curadoria",      label: "Fila de Curadoria", icon: ClipboardList,   end: false },
    { to: "/admin/historico",      label: "Histórico",         icon: History,         end: false },
    { to: "/admin/incorporadoras", label: "Incorporadoras",    icon: Building2,       end: false },
    ...(user?.perfil === "ADMIN_MASTER" ? [{ to: "/admin/usuarios", label: "Usuários", icon: Users, end: false }] : []),
  ] as const;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
        <Logo size="sm" />
        {onClose !== undefined && (
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Role badge */}
      <div className="px-3 pt-4">
        <div className="flex items-center gap-2 rounded-xl bg-navy-50 px-3.5 py-2.5">
          <ShieldCheck className="h-4 w-4 text-navy" />
          <span className="text-xs font-bold text-navy">
            {user?.perfil === "ADMIN_MASTER" ? "Administrador" : "Analista"}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Navegação</p>
        <ul className="space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onClose}
                className={({ isActive }) => cn("nav-item", isActive && "nav-item-active")}
              >
                <Icon className="h-4 w-4 shrink-0" />{label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="mb-1.5 flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-black text-white">
            {user?.email.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-900">{user?.email}</p>
            <p className="text-[10px] text-slate-400">{user?.perfil === "ADMIN_MASTER" ? "Admin Master" : "Analista"}</p>
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="nav-item w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout(): ReactNode {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F6FA]">
      <aside className="hidden w-60 shrink-0 border-r border-slate-100 lg:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-2xl">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-14 items-center gap-3 border-b border-slate-100 bg-white px-4 lg:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
          <Logo size="sm" />
        </div>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}
