import type { ReactNode } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { LayoutGrid, UserRound, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/investir/projetos", label: "Projetos", icon: LayoutGrid },
  { to: "/investir/perfil", label: "Perfil", icon: UserRound },
] as const;

export default function InvestidorLayout(): ReactNode {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  function handleLogout(): void {
    logout();
    navigate("/investir/login");
  }

  const base = user?.nome !== undefined && user.nome.length > 0 ? user.nome : user?.email ?? "?";
  const initial = base.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-navy-dark via-navy to-navy-dark">
        <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/investir" aria-label="Atlas Hub — área do investidor" className="shrink-0">
            <Logo size="md" scheme="dark" showIcon />
          </Link>

          <nav className="flex items-center gap-1" aria-label="Área do investidor">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "relative inline-flex items-center gap-2 rounded-[4px] px-2.5 py-2 text-xs font-semibold transition-colors sm:px-3",
                    "after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:transition-opacity after:content-['']",
                    isActive
                      ? "text-white after:bg-gold after:opacity-100"
                      : "text-white/60 after:opacity-0 hover:text-white",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-[4px] border border-white/10 bg-white/5 py-1 pl-1 pr-3 sm:flex">
              <span className="flex h-6 w-6 items-center justify-center rounded-[3px] bg-gold text-[11px] font-bold text-navy-dark">
                {initial}
              </span>
              <span className="max-w-[160px] truncate text-xs text-white/70">{user?.email}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-9 items-center gap-2 rounded-[4px] border border-white/20 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/10 sm:px-3"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
