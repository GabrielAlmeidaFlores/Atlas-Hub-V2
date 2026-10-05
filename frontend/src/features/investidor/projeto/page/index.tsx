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
  Users,
  ScrollText,
  ExternalLink,
  Linkedin,
  Calculator,
  CreditCard,
  Landmark,
} from "lucide-react";
import { api } from "@/services/api";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ViabilidadeReadOnly } from "@/components/shared/viabilidade-calculator";
import type { ViabilidadeProjeto } from "@/types";

interface Documentos {
  readonly matriculaUrl: string | null;
  readonly alvaraUrl: string | null;
  readonly memorialUrl: string | null;
  readonly plantaUrl: string | null;
  readonly viabilidadeUrl: string | null;
  readonly orcamentoUrl: string | null;
  readonly projeto3dUrl: string | null;
  readonly contratoSpeUrl: string | null;
  readonly cndUrl: string | null;
  readonly outrosUrls: string[];
}

interface MembroEquipe {
  readonly nome: string;
  readonly cargo: string;
  readonly bio: string;
  readonly fotoUrl: string | null;
  readonly linkedin: string | null;
}

interface IncorporadoraResumo {
  readonly razaoSocial: string;
  readonly descricao: string | null;
  readonly site: string | null;
  readonly endereco: string | null;
}

interface ProjetoDetalhe {
  readonly id: string;
  readonly status: string;
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
  readonly parcelado: boolean;
  readonly numParcelas: number | null;
  readonly percentualEntrada: number | null;
  readonly documentos: Documentos;
  readonly viabilidade: ViabilidadeProjeto | null;
  readonly equipe: MembroEquipe[];
  readonly incorporadora: IncorporadoraResumo | null;
  readonly analistaNome: string | null;
  readonly ofertaLink: string | null;
  readonly criadoEm: string;
  readonly aprovadoEm: string | null;
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

const DOC_LABELS: readonly (readonly [keyof Documentos, string])[] = [
  ["matriculaUrl", "Matrícula do imóvel"],
  ["alvaraUrl", "Alvará"],
  ["memorialUrl", "Memorial descritivo"],
  ["plantaUrl", "Planta"],
  ["viabilidadeUrl", "Estudo de viabilidade"],
  ["orcamentoUrl", "Orçamento de obra"],
  ["projeto3dUrl", "Projeto 3D"],
  ["contratoSpeUrl", "Contrato SPE"],
  ["cndUrl", "CND"],
];

function mes(meses: number | null): string {
  if (meses === null) return "—";
  return `${meses} ${meses === 1 ? "mês" : "meses"}`;
}

function formatData(iso: string | null): string {
  if (iso === null || iso === "") return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function Fact({ icon: Icon, label, value }: { readonly icon: typeof Wallet; readonly label: string; readonly value: string }): ReactNode {
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

function InfoCard({ icon: Icon, title, children }: { readonly icon: typeof Wallet; readonly title: string; readonly children: ReactNode }): ReactNode {
  return (
    <section className="rounded-[12px] border border-border bg-card p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-navy-50">
          <Icon className="h-4 w-4 text-navy" strokeWidth={1.75} />
        </span>
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
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

              {data.videoUrl !== null && (
                <a
                  href={data.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-navy hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Assistir ao vídeo do projeto
                </a>
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
            <Fact icon={Landmark} label="Tipo de oferta" value={data.tipoOferta !== null ? TIPO_OFERTA[data.tipoOferta] ?? data.tipoOferta : "—"} />
            {data.parcelado && <Fact icon={CreditCard} label="Entrada" value={data.percentualEntrada !== null ? `${data.percentualEntrada}%` : "—"} />}
            {data.parcelado && <Fact icon={CreditCard} label="Parcelas" value={data.numParcelas !== null ? `${data.numParcelas}x` : "—"} />}
            <Fact icon={CalendarClock} label="Publicado em" value={formatData(data.publicadoEm)} />
            <Fact icon={CalendarClock} label="Criado em" value={formatData(data.criadoEm)} />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {data.descricao.length > 0 && (
              <InfoCard icon={ScrollText} title="Sobre o projeto">
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{data.descricao}</p>
              </InfoCard>
            )}
            {data.planoSaida !== null && data.planoSaida.length > 0 && (
              <InfoCard icon={TrendingUp} title="Plano de saída">
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{data.planoSaida}</p>
              </InfoCard>
            )}
          </div>

          {data.viabilidade !== null && (
            <div className="mt-6">
              <InfoCard icon={Calculator} title="Viabilidade do projeto">
                <ViabilidadeReadOnly data={data.viabilidade} />
              </InfoCard>
            </div>
          )}

          {data.equipe.length > 0 && (
            <div className="mt-6">
              <InfoCard icon={Users} title="Equipe do projeto">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.equipe.map((m) => (
                    <div key={`${m.nome}-${m.cargo}`} className="flex gap-3 rounded-[8px] border border-border p-4">
                      {m.fotoUrl !== null ? (
                        <img src={m.fotoUrl} alt="" className="h-12 w-12 shrink-0 rounded-[8px] object-cover" />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-navy-50 text-base font-bold text-navy">
                          {m.nome.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">{m.nome}</p>
                        <p className="text-xs font-medium text-muted-foreground">{m.cargo}</p>
                        {m.bio.length > 0 && <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{m.bio}</p>}
                        {m.linkedin !== null && m.linkedin.length > 0 && (
                          <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline">
                            <Linkedin className="h-3.5 w-3.5" />
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </InfoCard>
            </div>
          )}

          {(() => {
            const docs = DOC_LABELS
              .map(([key, label]) => ({ label, url: data.documentos[key] as string | null }))
              .filter((d): d is { label: string; url: string } => d.url !== null && d.url !== "");
            const outros = data.documentos.outrosUrls.map((url, i) => ({ label: `Documento adicional ${String(i + 1)}`, url }));
            const todos = [...docs, ...outros];
            if (todos.length === 0) return null;
            return (
              <div className="mt-6">
                <InfoCard icon={FileText} title="Documentação">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {todos.map((d) => (
                      <a
                        key={d.url}
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-3 rounded-[8px] border border-border bg-card px-4 py-3 text-left transition-colors hover:border-gold/40 hover:bg-muted"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-navy-50">
                            <FileText className="h-4 w-4 text-navy" strokeWidth={1.75} />
                          </span>
                          <span className="truncate text-sm font-medium text-foreground">{d.label}</span>
                        </span>
                        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-gold" />
                      </a>
                    ))}
                  </div>
                </InfoCard>
              </div>
            );
          })()}

          {data.incorporadora !== null && (
            <div className="mt-6">
              <InfoCard icon={Building2} title="Incorporadora">
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-bold text-foreground">{data.incorporadora.razaoSocial}</p>
                  {data.incorporadora.descricao !== null && data.incorporadora.descricao.length > 0 && (
                    <p className="text-sm leading-relaxed text-muted-foreground">{data.incorporadora.descricao}</p>
                  )}
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    {data.incorporadora.endereco !== null && data.incorporadora.endereco.length > 0 && (
                      <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gold" />{data.incorporadora.endereco}</span>
                    )}
                    {data.incorporadora.site !== null && data.incorporadora.site.length > 0 && (
                      <a href={data.incorporadora.site} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-navy hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" />Site
                      </a>
                    )}
                    {data.analistaNome !== null && data.analistaNome.length > 0 && (
                      <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-gold" />Curadoria: {data.analistaNome}</span>
                    )}
                  </div>
                </div>
              </InfoCard>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
