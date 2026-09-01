import { type ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, ShieldCheck } from "lucide-react";
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

function ProjetoCard({
  projeto,
  ctaClassName,
  ctaLabel = "Ver Projeto",
  projectNameClassName = "text-[#D2A047]",
}: {
  readonly projeto: ProjetoPublico;
  readonly ctaClassName?: string;
  readonly ctaLabel?: string;
  readonly projectNameClassName?: string;
}): ReactNode {
  const href = projeto.ofertaLink;
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
        <h3 className={cn("lp-project-title mt-3 w-full", projectNameClassName)}>{projeto.nome}</h3>
        <p className="mt-1.5 flex w-full items-center gap-1.5 text-sm font-bold text-black">
          <MapPin className="h-4 w-4 shrink-0 text-[#D2A047]" strokeWidth={1.75} />
          {projeto.cidade}, {projeto.estado}
        </p>

        <div className="mt-2 grid w-full grid-cols-1 gap-2">
          <div className="w-full">
            <p className="text-[13px] font-normal text-black">
              Captação
            </p>
            <p className="mt-1 text-[28px] font-extrabold text-navy">
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

        <span className={cn("lp-project-cta mt-3 w-full", ctaClassName)}>
          {ctaLabel}
        </span>
      </div>
    </>
  );

  if (href !== null && href.length > 0) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="lp-project-card group">
        {content}
      </a>
    );
  }

  return <div className="lp-project-card lp-project-card-disabled group">{content}</div>;
}

function resolveCarouselRowCount(itemCount: number, maxRows: number): number {
  if (itemCount <= 0 || maxRows <= 1) return 1;
  const cap = Math.min(maxRows, itemCount);
  let bestRows = 1;
  let bestWaste = itemCount;

  for (let rows = 1; rows <= cap; rows += 1) {
    const cols = Math.ceil(itemCount / rows);
    const lastColCount = itemCount - (cols - 1) * rows;
    const waste = rows - lastColCount;
    if (waste < bestWaste || (waste === bestWaste && rows > bestRows)) {
      bestWaste = waste;
      bestRows = rows;
    }
  }

  return bestRows;
}

export function ProjetosAtlas({
  shellClassName,
  sectionClassName,
  titleSuffix = " em captação",
  titleHighlightClassName = "text-[#D2A047]",
  titleSuffixClassName = "text-white",
  ctaClassName,
  ctaLabel,
  projectNameClassName,
  carouselRows,
  paginatedGrid,
  projectsPerPage = 12,
  mobileSingleCarousel,
  viewAllProjectsOnMobile,
}: {
  readonly shellClassName?: string;
  readonly sectionClassName?: string;
  readonly titleSuffix?: string;
  readonly titleHighlightClassName?: string;
  readonly titleSuffixClassName?: string;
  readonly ctaClassName?: string;
  readonly ctaLabel?: string;
  readonly projectNameClassName?: string;
  readonly carouselRows?: number;
  readonly paginatedGrid?: boolean;
  readonly projectsPerPage?: number;
  readonly mobileSingleCarousel?: boolean;
  readonly viewAllProjectsOnMobile?: boolean;
}): ReactNode {
  const [items, setItems] = useState<ProjetoPublico[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [singleRowViewport, setSingleRowViewport] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const loopingRef = useRef(false);
  const mobileSingleCarouselRef = useRef(mobileSingleCarousel ?? false);
  const singleRowViewportRef = useRef(false);
  const maxCarouselRows = carouselRows ?? 1;
  const desktopMultiRow = maxCarouselRows > 1;
  mobileSingleCarouselRef.current = mobileSingleCarousel ?? false;
  singleRowViewportRef.current = singleRowViewport;
  const useMultiRowLayout = desktopMultiRow && !singleRowViewport;
  const usePaginatedGrid = paginatedGrid === true && !singleRowViewport;
  const pageSize = projectsPerPage;
  const fetchLimit = usePaginatedGrid ? pageSize : desktopMultiRow ? maxCarouselRows * 4 : 5;
  const fetchOffset = usePaginatedGrid ? pageIndex * pageSize : 0;
  const effectiveRowCount =
    items !== null && useMultiRowLayout
      ? resolveCarouselRowCount(items.length, maxCarouselRows)
      : maxCarouselRows;

  useEffect(() => {
    if (!mobileSingleCarousel) return;
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const sync = (): void => setSingleRowViewport(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, [mobileSingleCarousel]);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    const query = usePaginatedGrid
      ? `/publico/projetos?limit=${String(pageSize)}&offset=${String(fetchOffset)}`
      : `/publico/projetos?limit=${String(fetchLimit)}`;
    void api
      .get<{ items: ProjetoPublico[]; total?: number }>(query)
      .then((data) => {
        if (!cancelled) {
          setItems(data.items);
          setTotal(usePaginatedGrid ? data.total ?? data.items.length : data.items.length);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setItems([]);
          setTotal(0);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fetchLimit, fetchOffset, pageSize, usePaginatedGrid]);

  const projectColumns =
    items === null || items.length === 0 || !useMultiRowLayout
      ? []
      : Array.from({ length: Math.ceil(items.length / effectiveRowCount) }, (_, columnIndex) =>
          items.slice(columnIndex * effectiveRowCount, columnIndex * effectiveRowCount + effectiveRowCount),
        );

  const loopItems =
    useMultiRowLayout || items === null || items.length === 0
      ? []
      : [0, 1, 2].flatMap((copy) =>
          items.map((projeto) => ({
            projeto,
            loopKey: `${String(copy)}-${projeto.id}`,
          })),
        );

  useEffect(() => {
    if (useMultiRowLayout) return;
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

      const useCenterPick =
        mobileSingleCarouselRef.current && singleRowViewportRef.current;
      const featured = useCenterPick
        ? visible.sort((a, b) => b.overlap - a.overlap)[0]
        : visible.length >= 2
          ? visible[1]
          : visible[0];
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
  }, [items, useMultiRowLayout]);

  function scrollBy(dir: -1 | 1): void {
    const el = scrollerRef.current;
    if (el === null) return;
    const slideSelector = useMultiRowLayout ? ".lp-project-slide-column" : ".lp-project-slide";
    const slide = el.querySelector(slideSelector);
    const amount = slide instanceof HTMLElement ? slide.offsetWidth + 40 : Math.min(el.clientWidth * 0.8, 400);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  const loading = items === null;
  const empty = items !== null && items.length === 0;
  const totalPages = usePaginatedGrid ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const hasCarouselItems =
    !usePaginatedGrid && (useMultiRowLayout ? projectColumns.length > 0 : loopItems.length > 0);
  const hasPaginatedItems = usePaginatedGrid && items !== null && items.length > 0;
  const showMobileCarouselNav = mobileSingleCarousel && singleRowViewport;
  const resolvedCtaLabel = ctaLabel ?? "Ver Projeto";
  const showPaginatedNav = usePaginatedGrid && totalPages > 1;

  return (
    <section
      id="projetos-atlas"
      className={cn("lp-projects-section py-10 lg:py-14", sectionClassName)}
      data-analytics-section="projetos"
    >
      <div className={cn("lp-projects-shell relative overflow-hidden py-10 lg:py-14", shellClassName)}>
      <div className="lp-container relative">
        <AnimateIn className="mx-auto mb-6 max-w-2xl text-center lg:mb-8">
          <h2 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl md:text-4xl">
            <span className={titleHighlightClassName}>projetos</span>
            <span className={titleSuffixClassName}>{titleSuffix}</span>
          </h2>
        </AnimateIn>

        {!loading && empty && (
          <AnimateIn className="lp-project-card mx-auto max-w-2xl px-8 py-12 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[16px] border border-gold/25 bg-gold/10">
              <ShieldCheck className="h-6 w-6 text-gold" />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">Nenhuma oferta publicada ainda</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {failed
                ? "Não foi possível carregar a vitrine no momento. Tente novamente em instantes."
                : "Só entram aqui projetos com oferta confirmada pela curadoria (status Oferta Publicada). Assim que houver publicações no Atlas, elas aparecem nesta lista."}
            </p>
          </AnimateIn>
        )}
      </div>

      {loading && usePaginatedGrid && (
        <div className="lp-container grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="lp-project-card p-6 sm:p-7">
              <div className="space-y-4">
                <div className="skeleton h-6 w-32" />
                <div className="skeleton h-6 w-4/5" />
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton mt-2 h-16 w-full" />
                <div className="skeleton h-11 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && !usePaginatedGrid && (
        <div className="lp-projects-bleed relative">
          <div
            className={cn(
              "lp-projects-track flex gap-8 overflow-hidden px-4 sm:gap-10 sm:px-6 lg:px-8",
              useMultiRowLayout ? "justify-start" : "justify-center",
              showMobileCarouselNav && "lp-projects-track-mobile-single",
            )}
          >
            {(useMultiRowLayout ? [0, 1] : [0, 1, 2]).map((i) => (
              <div
                key={i}
                className={cn(
                  "lp-project-slide",
                  showMobileCarouselNav && "lp-project-slide-mobile-single",
                  useMultiRowLayout && "lp-project-slide-column flex flex-col gap-8 sm:gap-10",
                )}
              >
                {useMultiRowLayout ? (
                  Array.from({ length: maxCarouselRows }, (_, row) => row).map((row) => (
                    <div key={row} className="lp-project-card p-6 sm:p-7">
                      <div className="space-y-4">
                        <div className="skeleton h-6 w-32" />
                        <div className="skeleton h-6 w-4/5" />
                        <div className="skeleton h-3 w-1/2" />
                        <div className="skeleton mt-2 h-16 w-full" />
                        <div className="skeleton h-11 w-full" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="lp-project-card p-6 sm:p-7">
                    <div className="space-y-4">
                      <div className="skeleton h-6 w-32" />
                      <div className="skeleton h-6 w-4/5" />
                      <div className="skeleton h-3 w-1/2" />
                      <div className="skeleton mt-2 h-16 w-full" />
                      <div className="skeleton h-11 w-full" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && hasPaginatedItems && (
        <>
          <div className="lp-container grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {items?.map((projeto, index) => (
              <AnimateIn key={projeto.id} delay={Math.min(index, 11) * 30} className="h-full">
                <ProjetoCard
                  projeto={projeto}
                  ctaClassName={ctaClassName}
                  ctaLabel={resolvedCtaLabel}
                  projectNameClassName={projectNameClassName}
                />
              </AnimateIn>
            ))}
          </div>
          {showPaginatedNav && (
            <div className="lp-container mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label="Página anterior"
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                className={cn(
                  "lp-carousel-nav lp-carousel-nav-gold-shell disabled:opacity-40 disabled:pointer-events-none",
                )}
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <p className="text-sm font-semibold text-[#6C4C14]">
                {pageIndex + 1} / {totalPages}
              </p>
              <button
                type="button"
                aria-label="Próxima página"
                disabled={pageIndex >= totalPages - 1}
                onClick={() => setPageIndex((prev) => Math.min(prev + 1, totalPages - 1))}
                className={cn(
                  "lp-carousel-nav lp-carousel-nav-gold-shell disabled:opacity-40 disabled:pointer-events-none",
                )}
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
          )}
        </>
      )}

      {!loading && hasCarouselItems && (
        <div className="relative">
          <div
            ref={scrollerRef}
            className={cn(
              "lp-projects-bleed lp-projects-track flex gap-8 overflow-x-auto sm:gap-10",
              "snap-x snap-mandatory scroll-smooth",
              "px-4 sm:px-6 lg:px-8",
              useMultiRowLayout && "items-start",
              showMobileCarouselNav && "lp-projects-track-mobile-single snap-center",
            )}
          >
            {useMultiRowLayout
              ? projectColumns.map((column, columnIndex) => (
                  <div
                    key={column.map((projeto) => projeto.id).join("-")}
                    className="lp-project-slide lp-project-slide-column flex flex-col gap-8 sm:gap-10"
                  >
                    {column.map((projeto, rowIndex) => (
                      <AnimateIn
                        key={projeto.id}
                        delay={Math.min(columnIndex * effectiveRowCount + rowIndex, 11) * 40}
                        className="h-full"
                      >
                        <ProjetoCard
                          projeto={projeto}
                          ctaClassName={ctaClassName}
                          ctaLabel={resolvedCtaLabel}
                          projectNameClassName={projectNameClassName}
                        />
                      </AnimateIn>
                    ))}
                  </div>
                ))
              : loopItems.map(({ projeto, loopKey }, i) => (
                  <div
                    key={loopKey}
                    data-loop-key={loopKey}
                    data-project-id={projeto.id}
                    className={cn(
                      "lp-project-slide",
                      showMobileCarouselNav && "lp-project-slide-mobile-single",
                      activeKey === loopKey && "lp-project-slide-active",
                    )}
                  >
                    <AnimateIn delay={Math.min(i, 4) * 40} className="h-full">
                      <ProjetoCard
                        projeto={projeto}
                        ctaClassName={ctaClassName}
                        ctaLabel={resolvedCtaLabel}
                        projectNameClassName={projectNameClassName}
                      />
                    </AnimateIn>
                  </div>
                ))}
          </div>

          <div
            className={cn(
              "lp-container relative mt-3 items-center justify-center gap-4",
              showMobileCarouselNav ? "flex" : "hidden md:flex",
            )}
          >
            <button
              type="button"
              aria-label="Projetos anteriores"
              onClick={() => scrollBy(-1)}
              className={cn("lp-carousel-nav", showMobileCarouselNav && "lp-carousel-nav-gold-shell")}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Próximos projetos"
              onClick={() => scrollBy(1)}
              className={cn("lp-carousel-nav", showMobileCarouselNav && "lp-carousel-nav-gold-shell")}
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
      {viewAllProjectsOnMobile && !loading && (
        <div className="lp-container mt-6 flex justify-center md:hidden">
          <Link
            to="/projetos"
            data-analytics-cta="projetos_ver_todos"
            className="inline-flex h-12 w-full max-w-[19.5rem] items-center justify-center rounded-[6px] bg-[#D2A047] px-6 text-sm font-bold text-white transition-opacity duration-200 hover:opacity-90"
          >
            Ver todos os projetos
          </Link>
        </div>
      )}
      </div>
    </section>
  );
}
