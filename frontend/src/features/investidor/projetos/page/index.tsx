import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { MapPin, TrendingUp, Building2 } from "lucide-react";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { ProjetoPublico } from "@/features/landing/components/projetos-atlas";

function ProjetoCard({ projeto }: { readonly projeto: ProjetoPublico }): ReactNode {
  const content = (
    <>
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {projeto.imagemUrl !== null && projeto.imagemUrl !== "" ? (
          <img
            src={projeto.imagemUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-navy-50">
            <Building2 className="h-7 w-7 text-navy/40" strokeWidth={1.5} />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center rounded-[4px] bg-navy/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          {projeto.statusLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-base font-extrabold leading-snug text-navy sm:text-lg">{projeto.nome}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-gold" strokeWidth={2} />
          {projeto.cidade}, {projeto.estado}
        </p>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Captação</p>
            <p className="mt-0.5 text-xl font-extrabold text-navy sm:text-2xl">
              {projeto.valorCaptar !== null ? formatCurrency(projeto.valorCaptar) : "—"}
            </p>
          </div>
          {projeto.rentabilidadeEstimada !== null && (
            <span className="inline-flex items-center gap-1 rounded-[4px] bg-status-success-subtle px-2 py-1 text-xs font-bold text-status-success">
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
              {projeto.rentabilidadeEstimada}% a.a.
            </span>
          )}
        </div>

        <div className="mt-auto pt-4">
          <span className="inline-flex h-10 w-full items-center justify-center rounded-[4px] bg-gold text-sm font-bold text-white transition-colors group-hover:bg-gold-dark">
            Ver projeto
          </span>
        </div>
      </div>
    </>
  );

  return (
    <Link
      to={`/investir/projetos/${projeto.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[12px] border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_12px_28px_rgba(27,43,94,0.1)]"
    >
      {content}
    </Link>
  );
}

export default function InvestidorProjetosPage(): ReactNode {
  const [items, setItems] = useState<ProjetoPublico[] | null>(null);
  const nome = useAuthStore((s) => s.user?.nome);

  useEffect(() => {
    let cancelled = false;
    void api
      .get<{ items: ProjetoPublico[] }>("/publico/projetos?limit=12")
      .then((data) => {
        if (!cancelled) setItems(data.items);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = items === null;
  const empty = items !== null && items.length === 0;
  const primeiroNome = (nome ?? "").trim().split(" ")[0] ?? "";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[14px] bg-gradient-to-br from-navy via-navy to-navy-dark px-6 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-gold/10 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-gold/5 blur-2xl" aria-hidden />
        <p className="relative text-[11px] font-bold uppercase tracking-[0.28em] text-gold">Área do investidor</p>
        <h1 className="relative mt-2 text-2xl font-extrabold text-white sm:text-3xl">
          {primeiroNome.length > 0 ? `Olá, ${primeiroNome}.` : "Projetos disponíveis"}
        </h1>
        <p className="relative mt-2 max-w-xl text-sm leading-relaxed text-white/70">
          Projetos imobiliários avaliados pela curadoria da Atlas Hub, prontos para receber investimento.
        </p>
      </section>

      <div className="mt-8">
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="overflow-hidden rounded-[12px] border border-border bg-card">
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-5 w-4/5" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {empty && (
          <EmptyState
            icon={Building2}
            title="Nenhum projeto disponível"
            description="Em breve novas oportunidades de investimento serão publicadas na sua área."
          />
        )}

        {!loading && !empty && (
          <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items?.map((projeto) => (
              <ProjetoCard key={projeto.id} projeto={projeto} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
