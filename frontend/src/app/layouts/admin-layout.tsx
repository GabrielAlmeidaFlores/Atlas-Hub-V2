import { useState, type ReactNode } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, History, Building2, Users, LogOut, Menu, X } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { Logo } from "@/components/shared/logo";
import { AppBreadcrumb } from "@/components/shared/app-breadcrumb";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function Sidebar({ onClose }: { readonly onClose?: () => void }): ReactNode {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  function handleLogout(): void {
    logout();
    navigate("/login");
  }

  const navItems = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/curadoria", label: "Fila de Curadoria", icon: ClipboardList, end: false },
    { to: "/admin/historico", label: "Histórico", icon: History, end: false },
    { to: "/admin/incorporadoras", label: "Incorporadoras", icon: Building2, end: false },
    ...(user?.perfil === "ADMIN_MASTER"
      ? [{ to: "/admin/usuarios", label: "Usuários", icon: Users, end: false }]
      : []),
  ] as const;

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-[4.25rem] items-center justify-between border-b border-sidebar-border px-5">
        <Logo size="lg" />
        {onClose !== undefined && (
          <button type="button" onClick={onClose} className="rounded-[8px] border border-border p-1.5 text-muted-foreground hover:bg-muted lg:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[11px] font-medium text-muted-foreground">MENU</p>
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onClose}
                className={({ isActive }) => cn("nav-item", isActive && "nav-item-active")}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-3 px-1 py-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9999px] border border-navy-200 bg-navy-50 text-[11px] font-bold text-navy">
            {user?.email.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <Tooltip content={user?.email ?? ""} side="top">
              <span className="block cursor-default truncate text-xs font-semibold text-foreground">
                {user?.email}
              </span>
            </Tooltip>
            <p className="text-[10px] font-medium text-muted-foreground">
              {user?.perfil === "ADMIN_MASTER" ? "Admin Master" : "Analista"}
            </p>
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="nav-item w-full text-destructive hover:bg-status-danger-subtle hover:text-destructive">
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout(): ReactNode {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border min-[1000px]:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 min-[1000px]:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border bg-sidebar shadow-xl">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="page-rail flex h-14 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-[8px] border border-border p-1.5 text-muted-foreground hover:bg-muted min-[1000px]:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <AppBreadcrumb />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
