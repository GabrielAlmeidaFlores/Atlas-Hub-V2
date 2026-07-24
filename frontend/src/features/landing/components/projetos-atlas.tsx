import { type ReactNode, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, ShieldCheck, TrendingUp } from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { api } from "@/services/api";
import { formatCurrency, cn } from "@/lib/utils";

export interface ProjetoPublico {
  readonly id: string;
  readonly nome: string;
  readonly cidade: string;
  readonly estado: string;
  readonly valorCaptar: number | null;
  readonly rentabilidadeEstimada: number | null;
  readonly status: string;
  readonly statusLabel: string;
  readonly ofertaLink: string | null;
  readonly imagemUrl: string | null;
  readonly publicadoEm: string;
  readonly percentualCaptado?: number | null;
  readonly prazoRestanteDias?: number | null;
}

function statusTone(label: string): "published" | "raising" | "soon" {
  const n = label.toLowerCase();
  if (n.includes("captação") || n.includes("captacao")) return "raising";
  if (n.includes("breve")) return "soon";
  return "published";
}

function ProjetoCard({ projeto }: { readonly projeto: ProjetoPublico }): ReactNode {
  const href = projeto.ofertaLink;
  const tone = statusTone(projeto.statusLabel);
  const percentual = projeto.percentualCaptado ?? null;
  const prazo = projeto.prazoRestanteDias ?? null;
  const hasProgress = percentual !== null || prazo !== null;

  const content = (
    <>
      <div className="lp-project-media">
        {projeto.imagemUrl !== null && projeto.imagemUrl !== "" ? (
          <img src={projeto.imagemUrl} alt="" className="lp-project-media-img" />
        ) : (
          <div className="lp-project-media-empty" aria-hidden>
            <ShieldCheck className="h-6 w-6 text-gold/70" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="lp-project-accent" aria-hidden />
      <div className="relative flex flex-1 flex-col gap-0 p-4 text-left sm:p-5">
        <span className={cn("lp-project-badge self-start", `lp-project-badge-${tone}`)}>
          {projeto.statusLabel}
        </span>

        <h3 className="lp-project-title mt-3 w-full">{projeto.nome}</h3>
        <p className="mt-1.5 flex w-full items-center gap-1.5 text-[13px] text-muted-foreground/80">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-navy/40" strokeWidth={1.75} />
          {projeto.cidade}, {projeto.estado}
        </p>

        <div className="lp-project-divider w-full" aria-hidden />

        <div className="lp-project-yield w-full">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gold" strokeWidth={2} />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Rentabilidade
            </p>
          </div>
          <p className="lp-project-yield-value">
            {projeto.rentabilidadeEstimada !== null
              ? `${String(projeto.rentabilidadeEstimada).replace(".", ",")}%`
              : "—"}
            {projeto.rentabilidadeEstimada !== null && (
              <span className="lp-project-yield-unit">a.a.</span>
            )}
          </p>
        </div>

        <div className="mt-2 grid w-full grid-cols-1 gap-2">
          <div className="lp-project-meta w-full">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Captação
            </p>
            <p className="mt-0.5 text-sm font-semibold text-navy">
              {projeto.valorCaptar !== null ? formatCurrency(projeto.valorCaptar) : "—"}
            </p>
          </div>

          {hasProgress && (
            <div className="lp-project-progress w-full">
              {percentual !== null && (
                <>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Progresso
                    </p>
                    <p className="text-xs font-semibold text-navy">{`${String(percentual)}%`}</p>
                  </div>
                  <div className="lp-project-progress-track">
                    <div
                      className="lp-project-progress-fill"
                      style={{ width: `${String(Math.min(Math.max(percentual, 0), 100))}%` }}
                    />
                  </div>
                </>
              )}
              {prazo !== null && (
                <p className={cn("text-xs text-muted-foreground", percentual !== null && "mt-2.5")}>
                  {prazo > 0 ? `${String(prazo)} dias restantes` : "Prazo encerrado"}
                </p>
              )}
            </div>
          )}
        </div>

        <span className="lp-project-cta mt-3 w-full">
          Ver Projeto
        </span>
      </div>
    </>
  );

  if (href !== null && href.length > 0) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="lp-project-card">
        {content}
      </a>
    );
  }

  return <div className="lp-project-card lp-project-card-disabled">{content}</div>;
}

export function ProjetosAtlas(): ReactNode {
  const [items, setItems] = useState<ProjetoPublico[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const loopingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void api
      .get<{ items: ProjetoPublico[] }>("/publico/projetos?limit=5")
      .then((data) => {
        if (!cancelled) setItems(data.items);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setItems([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loopItems =
    items === null || items.length === 0
      ? []
      : [0, 1, 2].flatMap((copy) =>
          items.map((projeto) => ({
            projeto,
            loopKey: `${String(copy)}-${projeto.id}`,
          })),
        );

  useEffect(() => {
    const track = scrollerRef.current;
    if (track === null || items === null || items.length === 0) return;

    let frame = 0;
    let normalizeTimer = 0;

    function setWidth(): number {
      const el = scrollerRef.current;
      if (el === null) return 0;
      return el.scrollWidth / 3;
    }

    function jumpToMiddle(): void {
      const el = scrollerRef.current;
      if (el === null) return;
      const width = setWidth();
      if (width <= 0) return;
      loopingRef.current = true;
      el.scrollLeft = width;
      requestAnimationFrame(() => {
        loopingRef.current = false;
      });
    }

    function normalizeLoop(): void {
      const el = scrollerRef.current;
      if (el === null || loopingRef.current) return;
      const width = setWidth();
      if (width <= 0) return;
      if (el.scrollLeft < width * 0.5) {
        loopingRef.current = true;
        el.scrollLeft += width;
        requestAnimationFrame(() => {
          loopingRef.current = false;
        });
      } else if (el.scrollLeft >= width * 2.5) {
        loopingRef.current = true;
        el.scrollLeft -= width;
        requestAnimationFrame(() => {
          loopingRef.current = false;
        });
      }
    }

    function updateActive(): void {
      const el = scrollerRef.current;
      if (el === null) return;
      const trackRect = el.getBoundingClientRect();
      const slides = Array.from(el.querySelectorAll<HTMLElement>(".lp-project-slide"));
      const visible = slides
        .map((slide) => {
          const rect = slide.getBoundingClientRect();
          const overlap = Math.min(rect.right, trackRect.right) - Math.max(rect.left, trackRect.left);
          return { slide, overlap, left: rect.left };
        })
        .filter((entry) => entry.overlap > 48)
        .sort((a, b) => a.left - b.left);

      const featured = visible.length >= 2 ? visible[1] : visible[0];
      const nextKey = featured?.slide.dataset["loopKey"] ?? null;
      setActiveKey((prev) => (prev === nextKey ? prev : nextKey));
    }

    function onScroll(): void {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        updateActive();
      });
      window.clearTimeout(normalizeTimer);
      normalizeTimer = window.setTimeout(() => {
        normalizeLoop();
        updateActive();
      }, 140);
    }

    jumpToMiddle();
    updateActive();
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(normalizeTimer);
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  function scrollBy(dir: -1 | 1): void {
    const el = scrollerRef.current;
    if (el === null) return;
    const slide = el.querySelector(".lp-project-slide");
    const amount = slide instanceof HTMLElement ? slide.offsetWidth + 40 : Math.min(el.clientWidth * 0.8, 400);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  const loading = items === null;
  const empty = items !== null && items.length === 0;

  return (
    <section id="projetos-atlas" className="lp-projects-section relative overflow-x-hidden py-10 lg:py-14">
      <img
        src="/atlas-icon-bg.png"
        alt=""
        aria-hidden
        className="lp-projects-watermark pointer-events-none absolute select-none"
      />
      <div className="lp-container relative">
        <AnimateIn className="mx-auto mb-6 max-w-2xl text-center lg:mb-8">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gold">Vitrine</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Projetos Atlas</h2>
          <p className="mx-auto mt-5 text-base leading-relaxed text-muted-foreground">
            Oportunidades selecionadas pela curadoria — crowdfunding imobiliário regulado pela CVM Resolução 88.
          </p>
        </AnimateIn>

        {!loading && empty && (
          <AnimateIn className="lp-project-card mx-auto max-w-2xl px-8 py-12 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[16px] border border-gold/25 bg-gold/10">
              <ShieldCheck className="h-6 w-6 text-gold" />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">Novos empreendimentos em análise</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {failed
                ? "Não foi possível carregar a vitrine no momento. Em breve, novos projetos aprovados pela curadoria Atlas Hub estarão disponíveis aqui."
                : "Nossa curadoria está analisando novos projetos. Em breve, ofertas publicadas e reguladas pela CVM aparecerão nesta vitrine com total transparência."}
            </p>
          </AnimateIn>
        )}
      </div>

      {loading && (
        <div className="lp-projects-bleed relative">
          <div className="lp-projects-track flex justify-center gap-8 overflow-hidden px-4 sm:gap-10 sm:px-6 lg:px-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="lp-project-slide">
                <div className="lp-project-card p-6 sm:p-7">
                  <div className="space-y-4">
                    <div className="skeleton h-6 w-32" />
                    <div className="skeleton h-6 w-4/5" />
                    <div className="skeleton h-3 w-1/2" />
                    <div className="skeleton mt-2 h-16 w-full" />
                    <div className="skeleton h-11 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && loopItems.length > 0 && (
        <div className="relative">
          <div
            ref={scrollerRef}
            className={cn(
              "lp-projects-bleed lp-projects-track flex gap-8 overflow-x-auto sm:gap-10",
              "snap-x snap-mandatory scroll-smooth",
              "px-4 sm:px-6 lg:px-8",
            )}
          >
            {loopItems.map(({ projeto, loopKey }, i) => (
              <div
                key={loopKey}
                data-loop-key={loopKey}
                data-project-id={projeto.id}
                className={cn(
                  "lp-project-slide",
                  activeKey === loopKey && "lp-project-slide-active",
                )}
              >
                <AnimateIn delay={Math.min(i, 4) * 40} className="h-full">
                  <ProjetoCard projeto={projeto} />
                </AnimateIn>
              </div>
            ))}
          </div>

          <div className="lp-container relative mt-3 flex items-center justify-center gap-3">
            <button
              type="button"
              aria-label="Projetos anteriores"
              onClick={() => scrollBy(-1)}
              className="lp-carousel-nav"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Próximos projetos"
              onClick={() => scrollBy(1)}
              className="lp-carousel-nav"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
