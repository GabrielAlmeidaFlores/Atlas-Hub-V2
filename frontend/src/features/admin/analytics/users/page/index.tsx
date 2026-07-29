import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonPage } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import type { AnalyticsUserProfile } from "../../types";

export default function AdminAnalyticsUserPage(): ReactNode {
  const { userId } = useParams<{ userId: string }>();
  const addToast = useToastStore((s) => s.addToast);
  const [data, setData] = useState<AnalyticsUserProfile | null>(null);
  const [eventFilter, setEventFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId === undefined || userId === "") return;
    setIsLoading(true);
    const qs = new URLSearchParams();
    if (eventFilter !== "") qs.set("event", eventFilter);
    const suffix = qs.toString() !== "" ? `?${qs.toString()}` : "";
    void api
      .get<AnalyticsUserProfile>(`/admin/analytics/users/${userId}${suffix}`)
      .then(setData)
      .catch((err: unknown) => {
        addToast({ type: "error", title: "Erro", description: getApiErrorMessage(err) });
      })
      .finally(() => setIsLoading(false));
  }, [userId, eventFilter]);

  if (isLoading && data === null) return <SkeletonPage />;
  if (data === null) {
    return <div className="p-8 text-center text-muted-foreground">Usuário sem dados analíticos</div>;
  }

  const { profile, indicators, device, timeline } = data;

  return (
    <div className="animate-in">
      <PageHeader
        title={profile.nome ?? profile.email ?? profile.userId}
        description="Jornada LP → portal → curadoria"
        action={
          <Link to="/admin/analytics" className="btn btn-outline btn-sm inline-flex items-center gap-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Analytics
          </Link>
        }
      />

      <div className="page-content space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card space-y-2 p-5 text-sm lg:col-span-1">
            <h3 className="font-semibold text-foreground">Perfil</h3>
            <p><span className="text-muted-foreground">E-mail:</span> {profile.email ?? "—"}</p>
            <p><span className="text-muted-foreground">Empresa:</span> {profile.empresa ?? "—"}</p>
            <p><span className="text-muted-foreground">1º acesso:</span> {profile.firstSeenAt !== null ? formatDateTime(profile.firstSeenAt) : "—"}</p>
            <p><span className="text-muted-foreground">Último:</span> {profile.lastSeenAt !== null ? formatDateTime(profile.lastSeenAt) : "—"}</p>
            <p><span className="text-muted-foreground">Sessões:</span> {profile.totalSessions}</p>
            <p><span className="text-muted-foreground">Eventos:</span> {profile.totalEvents}</p>
          </div>
          <div className="card space-y-2 p-5 text-sm">
            <h3 className="font-semibold text-foreground">Indicadores Atlas</h3>
            <p><span className="text-muted-foreground">Logins:</span> {indicators.logins}</p>
            <p><span className="text-muted-foreground">Dias ativos:</span> {indicators.activeDays}</p>
            <p><span className="text-muted-foreground">Projetos criados:</span> {indicators.projectsCreated}</p>
            <p><span className="text-muted-foreground">Uploads:</span> {indicators.uploads}</p>
            <p><span className="text-muted-foreground">Submissões:</span> {indicators.submissions}</p>
            <p><span className="text-muted-foreground">Evt/sessão:</span> {indicators.avgEventsPerSession}</p>
          </div>
          <div className="card space-y-2 p-5 text-sm">
            <h3 className="font-semibold text-foreground">Dispositivo recente</h3>
            <p><span className="text-muted-foreground">Device:</span> {device.device ?? "—"}</p>
            <p><span className="text-muted-foreground">Browser:</span> {device.browser ?? "—"}</p>
            <p><span className="text-muted-foreground">SO:</span> {device.os ?? "—"}</p>
            <p><span className="text-muted-foreground">Tela:</span> {device.screen ?? "—"}</p>
            <p><span className="text-muted-foreground">Geo:</span> {[device.city, device.region, device.country].filter(Boolean).join(", ") || "—"}</p>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">Timeline</h3>
            <input
              className="field max-w-xs"
              placeholder="Filtrar evento (ex: login)"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            />
          </div>
          <ul className="space-y-2">
            {timeline.map((item) => (
              <li key={item.id} className="grid gap-1 border border-border p-3 text-sm sm:grid-cols-[10rem_12rem_1fr]">
                <span className="text-muted-foreground">{formatDateTime(item.ts)}</span>
                <span className="font-medium text-navy">{item.eventName}</span>
                <span className="truncate text-muted-foreground">{item.path ?? "—"}</span>
              </li>
            ))}
            {timeline.length === 0 && <p className="text-sm text-muted-foreground">Sem eventos.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
