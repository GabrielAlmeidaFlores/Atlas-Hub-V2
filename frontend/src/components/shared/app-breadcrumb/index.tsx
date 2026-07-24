import { type ReactNode, Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Crumb {
  readonly label: string;
  readonly to?: string;
}

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  perfil: "Empresa",
  notificacoes: "Notificações",
  projetos: "Projetos",
  novo: "Novo",
  editar: "Editar",
  curadoria: "Curadoria",
  historico: "Histórico",
  incorporadoras: "Incorporadoras",
  usuarios: "Usuários",
};

function buildCrumbs(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return [{ label: "Início" }];

  const crumbs: Crumb[] = [];
  let acc = "";

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i] ?? "";
    acc += `/${part}`;
    const isLast = i === parts.length - 1;
    const isId = /^[0-9a-f-]{8,}$/i.test(part) || (/^\d+$/.test(part) && part.length > 3);

    if (part === "admin") {
      if (isLast) crumbs.push({ label: "Dashboard" });
      continue;
    }

    let label = LABELS[part];
    if (label === undefined) {
      if (isId) label = "Detalhe";
      else label = part.charAt(0).toUpperCase() + part.slice(1);
    }

    crumbs.push(isLast ? { label } : { label, to: acc });
  }

  return crumbs;
}

export function AppBreadcrumb({ className }: { readonly className?: string }): ReactNode {
  const { pathname } = useLocation();
  const crumbs = buildCrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-xs">
        {crumbs.map((crumb, index) => (
          <Fragment key={`${crumb.label}-${String(index)}`}>
            {index > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/70" aria-hidden />}
            <li className="min-w-0">
              {crumb.to !== undefined ? (
                <Link to={crumb.to} className="truncate text-muted-foreground transition-colors hover:text-navy">
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate font-medium text-foreground">{crumb.label}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
