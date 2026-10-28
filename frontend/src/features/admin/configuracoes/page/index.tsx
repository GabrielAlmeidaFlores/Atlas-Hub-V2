import { useEffect, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BookOpen, Download, KeyRound, LockKeyhole, Settings, ShieldCheck, type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";
import AdminApiTokensPage from "@/features/admin/api-tokens/page";
import AdminApiDocsPage from "@/features/admin/api-docs/page";
import SecuritySection from "../sections/security-section";

type Tab = "tokens" | "docs" | "security";

interface ConfigSection {
  readonly id: Tab;
  readonly label: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly component: () => ReactNode;
}

function TokensSection(): ReactNode {
  return <AdminApiTokensPage embedded />;
}

function DocsSection(): ReactNode {
  return <AdminApiDocsPage embedded />;
}

const SECTIONS: readonly ConfigSection[] = [
  {
    id: "tokens",
    label: "Meus tokens de API",
    description: "Credenciais pessoais para integrações.",
    icon: KeyRound,
    component: TokensSection,
  },
  {
    id: "docs",
    label: "Documentação da API",
    description: "Endpoints, parâmetros e schemas.",
    icon: BookOpen,
    component: DocsSection,
  },
  {
    id: "security",
    label: "Segurança e acesso",
    description: "Alteração de senha da sua conta.",
    icon: LockKeyhole,
    component: SecuritySection,
  },
];

function tabFromValue(value: string | null): Tab {
  if (value === "docs" || value === "security") return value;
  return "tokens";
}

export default function AdminConfiguracoesPage(): ReactNode {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const tab = tabFromValue(searchParams.get("tab"));
  const section = SECTIONS.find((item) => item.id === tab) ?? SECTIONS[0]!;
  const ActiveSection = section.component;

  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0 });
  }, [tab]);

  function selectTab(next: Tab): void {
    setSearchParams({ tab: next });
  }

  return (
    <div className="animate-in">
      <PageHeader
        title="Configurações"
        description="Gerencie suas credenciais, segurança e documentação da API."
        action={tab === "docs" ? (
          <a className="btn btn-primary btn-sm rounded-[8px]" href={`${import.meta.env.BASE_URL}docs/openapi.json`} download="atlas-hub-openapi.json">
            <Download className="h-4 w-4" /> Baixar OpenAPI
          </a>
        ) : undefined}
      />

      <div className="page-content-wide pb-12">
        <div className="grid items-start gap-5 lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside className="space-y-3 lg:sticky lg:top-4">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-navy/[0.06] text-navy">
                  <Settings className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">Sua conta</p>
                  <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[10px] font-medium text-status-success">
                <ShieldCheck className="h-3 w-3" /> Escopo pessoal
              </div>
            </div>

            <nav className="card p-2" aria-label="Seções de configuração">
              {SECTIONS.map((item) => {
                const Icon = item.icon;
                const active = item.id === tab;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-[7px] px-3 py-2.5 text-left transition-colors",
                      active ? "bg-navy text-white" : "text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", active ? "text-gold" : "text-muted-foreground")} />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold">{item.label}</span>
                      <span className={cn("mt-0.5 block text-[10px] leading-relaxed", active ? "text-white/60" : "text-muted-foreground")}>{item.description}</span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <p className="px-2 text-[10px] leading-relaxed text-muted-foreground">
              Novas preferências podem ser adicionadas como novas seções nesta área.
            </p>
          </aside>

          <div className="min-w-0">
            <ActiveSection />
          </div>
        </div>
      </div>
    </div>
  );
}
