import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  TrendingUp,
  Building2,
  Percent,
  Wallet,
  FileText,
  Building,
  CalendarClock,
  Clock,
} from "lucide-react";
import { api } from "@/services/api";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface ProjetoDetalhe {
  readonly id: string;
  readonly nome: string;
  readonly modelo: string;
  readonly tipoImovel: string;
  readonly tipoOferta: string | null;
  readonly cidade: string;
  readonly estado: string;
  readonly endereco: string;
  readonly descricao: string;
  readonly fotos: string[];
  readonly videoUrl: string | null;
  readonly valorTotal: number | null;
  readonly valorCaptar: number | null;
  readonly rentabilidadeEstimada: number | null;
  readonly prazoObra: number | null;
  readonly prazoRetorno: number | null;
  readonly modeloRetorno: string | null;
  readonly planoSaida: string | null;
  readonly ofertaLink: string | null;
  readonly statusLabel: string;
  readonly publicadoEm: string;
}

const MODELO: Record<string, string> = {
  VENDA: "Construção para venda",
  RENDA: "Construção para renda",
  MISTO: "Misto (venda e renda)",
};

const TIPO_IMOVEL: Record<string, string> = {
  RESIDENCIAL: "Residencial",
  COMERCIAL: "Comercial",
  MISTO: "Misto",
};

const TIPO_OFERTA: Record<string, string> = {
  PUBLICA: "Oferta pública (CVM 88)",
  PRIVADA: "Oferta privada (club deal)",
};

const MODELO_RETORNO: Record<string, string> = {
  SCP: "SCP — Sociedade em Conta de Participação",
  NOTA_COMERCIAL: "Nota comercial",
};

function mes(meses: number | null): string {
  if (meses === null) return "—";
  return `${meses} ${meses === 1 ? "mês" : "meses"}`;
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  readonly icon: typeof Wallet;
  readonly label: string;
  readonly value: string;
}): ReactNode {
  return (
    <div className="rounded-[8px] border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-gold" strokeWidth={1.75} />
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-2 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

export default function InvestidorProjetoPage(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ProjetoDetalhe | null>(null);
  const [failed, setFailed] = useState(false);
  const [fotoAtiva, setFotoAtiva] = useState(0);

  useEffect(() => {
    if (id === undefined) return;
    let cancelled = false;
    setData(null);
    setFailed(false);
    void api
      .get<ProjetoDetalhe>(`/publico/projetos/${id}`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const loading = data === null && !failed;
  const foto = data !== null && data.fotos.length > 0 ? data.fotos[Math.min(fotoAtiva, data.fotos.length - 1)] : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/investir/projetos" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-navy">
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar aos projetos
      </Link>

      {failed && (
        <div className="mt-8">
          <EmptyState icon={Building2} title="Projeto não encontrado" description="Esta oferta pode ter sido encerrada ou removida." />
        </div>
      )}

      {loading && (
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="aspect-[16/10] w-full rounded-[12px]" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      )}

      {data !== null && (
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="overflow-hidden rounded-[12px] border border-border bg-muted">
                {foto !== null ? (
                  <img src={foto} alt="" className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center bg-navy-50">
                    <Building className="h-10 w-10 text-navy/30" strokeWidth={1.5} />
                  </div>
                )}
              </div>

              {data.fotos.length > 1 && (
                <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
                  {data.fotos.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setFotoAtiva(index)}
                      className={`overflow-hidden rounded-[6px] border ${index === fotoAtiva ? "border-gold" : "border-border"}`}
                      aria-label={`Foto ${index + 1}`}
                    >
                      <img src={url} alt="" className="aspect-[16/10] w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <span className="inline-flex w-fit items-center rounded-[4px] bg-navy px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                {data.statusLabel}
              </span>
              <h1 className="mt-3 text-2xl font-extrabold leading-tight text-navy sm:text-3xl">{data.nome}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4 text-gold" strokeWidth={2} />
                {data.endereco.length > 0 ? `${data.endereco} — ` : ""}
                {data.cidade}, {data.estado}
              </p>

              <div className="mt-5 rounded-[10px] border border-gold/30 bg-gold-50 p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gold-dark">Captação</p>
                <p className="mt-1 text-3xl font-extrabold text-navy">{data.valorCaptar !== null ? formatCurrency(data.valorCaptar) : "—"}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {data.rentabilidadeEstimada !== null && (
                    <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-status-success-subtle px-2.5 py-1 text-xs font-bold text-status-success">
                      <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
                      {data.rentabilidadeEstimada}% a.a.
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-white px-2.5 py-1 text-xs font-semibold text-navy">
                    <Building2 className="h-3.5 w-3.5 text-gold" strokeWidth={2} />
                    {MODELO[data.modelo] ?? data.modelo}
                  </span>
                </div>
              </div>

              <a
                href={data.ofertaLink ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-[4px] bg-gold text-sm font-bold text-white transition-colors hover:bg-gold-dark"
              >
                Investir neste projeto
              </a>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Você será direcionado ao ambiente de investimento da Atlas Hub.
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Fact icon={Wallet} label="Captação" value={data.valorCaptar !== null ? formatCurrency(data.valorCaptar) : "—"} />
            <Fact icon={Building2} label="Valor total do projeto" value={data.valorTotal !== null ? formatCurrency(data.valorTotal) : "—"} />
            <Fact icon={Percent} label="Rentabilidade estimada" value={data.rentabilidadeEstimada !== null ? `${data.rentabilidadeEstimada}% a.a.` : "—"} />
            <Fact icon={Clock} label="Prazo de obra" value={mes(data.prazoObra)} />
            <Fact icon={CalendarClock} label="Prazo de retorno" value={mes(data.prazoRetorno)} />
            <Fact icon={Building} label="Tipo de imóvel" value={TIPO_IMOVEL[data.tipoImovel] ?? data.tipoImovel} />
            <Fact icon={FileText} label="Retorno" value={data.modeloRetorno !== null ? MODELO_RETORNO[data.modeloRetorno] ?? data.modeloRetorno : "—"} />
            <Fact icon={MapPin} label="Tipo de oferta" value={data.tipoOferta !== null ? TIPO_OFERTA[data.tipoOferta] ?? data.tipoOferta : "—"} />
          </div>

          {data.descricao.length > 0 && (
            <section className="mt-10">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Sobre o projeto</h2>
              <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{data.descricao}</p>
            </section>
          )}

          {data.planoSaida !== null && data.planoSaida.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Plano de saída</h2>
              <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{data.planoSaida}</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
