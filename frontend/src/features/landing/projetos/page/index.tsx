import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { ProjetosAtlas } from "@/features/landing/components/projetos-atlas";
import { useLandingAnalytics } from "@/lib/analytics/use-landing-analytics";

function ProjetosHero(): ReactNode {
  const heroColor = "#001F4E";

  return (
    <section
      className="relative overflow-visible bg-gradient-to-b from-[#D1D1D6] via-[#E7E7EA] via-40% to-white to-65% px-4 pb-[40px] pt-5 sm:px-6 lg:px-8"
      data-analytics-section="hero"
    >
      <div className="relative overflow-hidden rounded-[14px] bg-[#001F4E] shadow-[0_10px_30px_rgba(7,17,34,0.18)]">
        <div className="relative min-h-[676px] overflow-hidden sm:hidden">
          <img
            src="/bg-projetos-mobile.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${heroColor} 0%, ${heroColor} 34%, ${heroColor}f2 42%, ${heroColor}d9 50%, ${heroColor}b3 58%, ${heroColor}80 66%, ${heroColor}4d 74%, ${heroColor}26 82%, transparent 92%)`,
            }}
            aria-hidden
          />
          <div className="relative z-10 px-6 pb-12 pt-8 text-left text-white">
            <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#D2A047]">
              Projetos
            </p>
            <h1 className="text-[30px] font-extrabold uppercase leading-[1.12] tracking-[0.04em]">
              CONHEÇA OS PROJETOS
              <br />
              EM CAPTAÇÃO
            </h1>
            <p className="mt-5 text-[17px] font-medium leading-snug tracking-[-0.04em] text-[#D2A047]">
              Todos os projetos listados passam pela curadoria técnica da Atlas Hub antes de chegar até você.
            </p>
            <Link
              to="/cadastro"
              data-analytics-cta="projetos_hero_investir"
              className="mt-8 flex h-12 w-full items-center justify-center rounded-[4px] bg-[#D2A047] px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
            >
              Quero investir
            </Link>
          </div>
        </div>

        <img
          src="/bg-projetos.png"
          alt=""
          className="absolute inset-0 hidden h-full w-full object-cover object-center sm:block"
        />
        <div className="lp-container relative hidden min-h-[480px] items-center py-3 sm:flex lg:min-h-[600px] lg:py-4">
          <div className="relative z-10 max-w-[680px]">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#D2A047]">
              Projetos
            </p>
            <h1 className="text-[32px] font-extrabold uppercase leading-[1.08] tracking-[0.04em] text-white md:text-[38px] lg:text-[44px]">
              Conheça os projetos
              <br />
              em captação
            </h1>
            <p className="mt-5 text-[22px] font-medium leading-relaxed tracking-[-0.03em] text-[#D2A047]">
              Todos os projetos listados passam pela curadoria técnica da Atlas Hub antes de chegar até você.
            </p>
            <Link
              to="/cadastro"
              data-analytics-cta="projetos_hero_investir"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-[4px] bg-[#D2A047] px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
            >
              Quero investir
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ProjetosPage(): ReactNode {
  useLandingAnalytics(true);
  return (
    <MarketingShell>
      <ProjetosHero />
      <ProjetosAtlas
        sectionClassName="max-sm:px-4 max-sm:pt-0"
        shellClassName="!bg-[#B89048] max-sm:![background-image:url('/projetos-mobile-sessao.png')] sm:![background-image:url('/projetos-sessao.svg')] max-sm:!bg-[length:100%_auto] sm:bg-[length:100%_auto] bg-bottom bg-no-repeat max-sm:!rounded-[14px] max-sm:!mx-0 max-sm:shadow-[0_10px_30px_rgba(7,17,34,0.18)]"
        titleSuffix=" disponíveis"
        titleHighlightClassName="text-[#6C4C14]"
        titleSuffixClassName="text-[#6C4C14]"
        ctaClassName="!bg-[#001F4E] group-hover:!bg-[#001a40] !shadow-none group-hover:!shadow-[0_4px_14px_rgba(0,31,78,0.28)]"
        ctaLabel="Ver projeto"
        projectNameClassName="text-[#001F4E]"
        paginatedGrid
        projectsPerPage={12}
        mobileSingleCarousel
      />
    </MarketingShell>
  );
}
