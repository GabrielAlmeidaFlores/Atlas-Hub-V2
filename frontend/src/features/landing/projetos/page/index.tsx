import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { ProjetosAtlas } from "@/features/landing/components/projetos-atlas";
import { useLandingAnalytics } from "@/lib/analytics/use-landing-analytics";

function ProjetosHero(): ReactNode {
  return (
    <section
      className="relative overflow-visible bg-gradient-to-b from-[#D1D1D6] via-[#E7E7EA] via-40% to-white to-65% px-4 pb-[40px] pt-5 sm:px-6 lg:px-8"
      data-analytics-section="hero"
    >
      <div className="relative min-h-[420px] overflow-hidden rounded-[14px] bg-[#001F4E] shadow-[0_10px_30px_rgba(7,17,34,0.18)] sm:min-h-[480px] lg:min-h-[600px]">
        <img
          src="/bg-projetos.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="lp-container relative flex min-h-[420px] items-center py-6 sm:min-h-[480px] sm:py-3 lg:min-h-[600px] lg:py-4">
          <div className="relative z-10 max-w-[680px]">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#D2A047]">
              Projetos
            </p>
            <h1 className="text-[28px] font-extrabold uppercase leading-[1.08] tracking-[0.04em] text-white sm:text-[32px] md:text-[38px] lg:text-[44px]">
              Conheça os projetos
              <br />
              em captação
            </h1>
            <p className="mt-5 text-[18px] font-medium leading-relaxed tracking-[-0.03em] text-[#D2A047] sm:text-[22px]">
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
        shellClassName="!bg-[#B89048] ![background-image:url('/projetos-sessao.svg')] bg-[length:100%_auto] bg-bottom bg-no-repeat"
        titleSuffix=" disponíveis"
        titleHighlightClassName="text-[#6C4C14]"
        titleSuffixClassName="text-[#6C4C14]"
        ctaClassName="!bg-[#001F4E] group-hover:!bg-[#001a40] !shadow-none group-hover:!shadow-[0_4px_14px_rgba(0,31,78,0.28)]"
        projectNameClassName="text-[#001F4E]"
        carouselRows={3}
      />
    </MarketingShell>
  );
}
