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
  { key: "SUBMETIDO" as StatusProjeto, label: "Aguardando", icon: Clock, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { key: "EM_ANALISE" as StatusProjeto, label: "Em Análise", icon: ClipboardList, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  { key: "AJUSTE_SOLICITADO" as StatusProjeto, label: "Aguardando Ajuste", icon: AlertCircle, iconBg: "bg-orange-50", iconColor: "text-orange-600" },
  { key: "APROVADO" as StatusProjeto, label: "Aprovados", icon: CheckCircle, iconBg: "bg-green-50", iconColor: "text-green-600" },
  { key: "REPROVADO" as StatusProjeto, label: "Reprovados", icon: XCircle, iconBg: "bg-red-50", iconColor: "text-red-600" },
  { key: "OFERTA_CRIADA" as StatusProjeto, label: "Ofertas Publicadas", icon: TrendingUp, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
] as const;

const FUNNEL = [
  { key: "SUBMETIDO" as StatusProjeto, label: "Submetidos", color: "bg-blue-400" },
  { key: "EM_ANALISE" as StatusProjeto, label: "Em Análise", color: "bg-amber-400" },
  { key: "APROVADO" as StatusProjeto, label: "Aprovados", color: "bg-green-500" },
  { key: "OFERTA_CRIADA" as StatusProjeto, label: "Publicados", color: "bg-emerald-500" },
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
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STATS.map(({ key, label, icon, iconBg, iconColor }) => (
            <StatCard
              key={key}
              label={label}
              value={String(metricas?.metricas[key] ?? 0)}
              icon={icon}
              iconBg={iconBg}
              iconColor={iconColor}
            />
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Funil */}
          {metricas !== null && (
            <div className="card p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-navy" />
                <h2 className="font-semibold text-[#111827]">Funil de Projetos</h2>
              </div>
              <div className="space-y-3">
                {FUNNEL.map(({ key, label, color }) => {
                  const value = metricas.metricas[key] ?? 0;
                  const pct = metricas.total > 0 ? (value / metricas.total) * 100 : 0;
                  return (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-[#374151]">{label}</span>
                        <span className="font-semibold text-[#111827]">{String(value)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                        <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${String(Math.round(pct))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-[#111827]">Acesso Rápido</h2>
            <div className="space-y-2">
              {[
                { to: "/admin/curadoria", label: "Fila de Curadoria", desc: `${String(metricas?.metricas["SUBMETIDO"] ?? 0)} aguardando análise`, icon: ClipboardList, color: "text-blue-600 bg-blue-50" },
                { to: "/admin/historico", label: "Histórico de Decisões", desc: `${String((metricas?.metricas["APROVADO"] ?? 0) + (metricas?.metricas["OFERTA_CRIADA"] ?? 0))} aprovados no total`, icon: CheckCircle, color: "text-green-600 bg-green-50" },
                { to: "/admin/incorporadoras", label: "Incorporadoras", desc: "Ver todos os cadastros", icon: TrendingUp, color: "text-navy bg-navy-50" },
              ].map(({ to, label, desc, icon: Icon, color }) => (
                <Link key={to} to={to} className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] px-4 py-3 transition-all hover:border-navy/20 hover:shadow-sm">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#111827]">{label}</p>
                    <p className="text-xs text-[#9CA3AF]">{desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#9CA3AF]" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
