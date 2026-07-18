import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import type { DashboardMetricas, StatusProjeto } from "@/types";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonPage } from "@/components/ui/skeleton";
import {
  ClipboardList, CheckCircle, XCircle, Clock,
  TrendingUp, BarChart3, ArrowRight, AlertCircle,
} from "lucide-react";

const STATS = [
  { key: "SUBMETIDO" as StatusProjeto, label: "Aguardando", icon: Clock, accent: "info" as const },
  { key: "EM_ANALISE" as StatusProjeto, label: "Em Análise", icon: ClipboardList, accent: "warning" as const },
  { key: "AJUSTE_SOLICITADO" as StatusProjeto, label: "Aguardando Ajuste", icon: AlertCircle, accent: "warning" as const },
  { key: "APROVADO" as StatusProjeto, label: "Aprovados", icon: CheckCircle, accent: "success" as const },
  { key: "REPROVADO" as StatusProjeto, label: "Reprovados", icon: XCircle, accent: "danger" as const },
  { key: "OFERTA_CRIADA" as StatusProjeto, label: "Ofertas Publicadas", icon: TrendingUp, accent: "success" as const },
] as const;

const FUNNEL = [
  { key: "SUBMETIDO" as StatusProjeto, label: "Submetidos", color: "bg-status-info" },
  { key: "EM_ANALISE" as StatusProjeto, label: "Em Análise", color: "bg-status-warning" },
  { key: "APROVADO" as StatusProjeto, label: "Aprovados", color: "bg-status-success" },
  { key: "OFERTA_CRIADA" as StatusProjeto, label: "Publicados", color: "bg-status-success" },
] as const;

export default function AdminDashboardPage(): ReactNode {
  const [metricas, setMetricas] = useState<DashboardMetricas | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void api.get<DashboardMetricas>("/admin/dashboard/metricas")
      .then(setMetricas)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <SkeletonPage />;

  return (
    <div className="animate-in">
      <PageHeader
        title="Dashboard"
        description="Visão geral da plataforma Atlas Hub"
        action={
          <Link to="/admin/curadoria" className="btn btn-primary btn-sm">
            <ClipboardList className="h-3.5 w-3.5" /> Ver fila
          </Link>
        }
      />

      <div className="page-content space-y-6">
        <div className="kpi-strip grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {STATS.map(({ key, label, icon, accent }) => (
            <StatCard
              key={key}
              label={label}
              value={String(metricas?.metricas[key] ?? 0)}
              icon={icon}
              accent={accent}
            />
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Funil */}
          {metricas !== null && (
            <div className="card p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-navy" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Funil de Projetos</h2>
              </div>
              <div className="space-y-3">
                {FUNNEL.map(({ key, label, color }) => {
                  const value = metricas.metricas[key] ?? 0;
                  const pct = metricas.total > 0 ? (value / metricas.total) * 100 : 0;
                  return (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{label}</span>
                        <span className="text-sm font-bold uppercase tracking-widest text-foreground">{String(value)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden   bg-muted">
                        <div className={`h-2   transition-all duration-700 ${color}`} style={{ width: `${String(Math.round(pct))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-foreground">Acesso Rápido</h2>
            <div className="space-y-2">
              {[
                { to: "/admin/curadoria", label: "Fila de Curadoria", desc: `${String(metricas?.metricas["SUBMETIDO"] ?? 0)} aguardando análise`, icon: ClipboardList, color: "text-status-info bg-status-info-subtle" },
                { to: "/admin/historico", label: "Histórico de Decisões", desc: `${String((metricas?.metricas["APROVADO"] ?? 0) + (metricas?.metricas["OFERTA_CRIADA"] ?? 0))} aprovados no total`, icon: CheckCircle, color: "text-status-success bg-status-success-subtle" },
                { to: "/admin/incorporadoras", label: "Incorporadoras", desc: "Ver todos os cadastros", icon: TrendingUp, color: "text-navy bg-navy-50" },
              ].map(({ to, label, desc, icon: Icon, color }) => (
                <Link key={to} to={to} className="flex items-center gap-3 border border-border px-4 py-3 transition-all hover:border-navy/20 hover:bg-muted">
                  <div className={`flex h-9 w-9 items-center justify-center   ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
