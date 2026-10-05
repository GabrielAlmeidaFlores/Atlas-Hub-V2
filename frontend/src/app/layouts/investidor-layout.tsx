import type { ReactNode } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { LayoutGrid, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/investir/projetos", label: "Projetos", icon: LayoutGrid },
] as const;

export default function InvestidorLayout(): ReactNode {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  function handleLogout(): void {
    logout();
    navigate("/investir/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy">
        <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/investir" aria-label="Atlas Hub — área do investidor" className="shrink-0">
            <Logo size="md" scheme="dark" />
          </Link>

          <nav className="hidden items-center gap-1 sm:flex" aria-label="Área do investidor">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-2 rounded-[4px] px-3 py-2 text-xs font-semibold transition-colors",
                    isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden max-w-[180px] truncate text-xs text-white/60 sm:block">{user?.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-9 items-center gap-2 rounded-[4px] border border-white/20 px-3 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
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
