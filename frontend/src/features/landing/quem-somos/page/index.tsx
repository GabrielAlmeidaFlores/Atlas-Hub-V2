import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimateIn } from "@/components/animate-in";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { WhatsappLink } from "@/components/shared/whatsapp-cta";
import { hasWhatsappSupport } from "@/lib/whatsapp";
import { useLandingAnalytics } from "@/lib/analytics/use-landing-analytics";

function QuemSomosHero(): ReactNode {
  return (
    <section
      className="relative overflow-visible bg-gradient-to-b from-[#D1D1D6] via-[#E7E7EA] via-40% to-white to-65% px-4 pb-[40px] pt-5 sm:px-6 lg:px-8"
      data-analytics-section="hero"
    >
      <div className="relative min-h-[557px] overflow-hidden rounded-[14px] bg-[#001F4E] shadow-[0_10px_30px_rgba(7,17,34,0.18)] lg:min-h-[600px]">
        <img
          src="/bg-quemsomos.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="lp-container relative flex min-h-[557px] items-center py-3 lg:min-h-[600px] lg:py-4">
          <div className="relative z-10 max-w-[680px]">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#D2A047]">
              Quem somos
            </p>
            <h1 className="text-[32px] font-extrabold uppercase leading-[1.08] tracking-[0.04em] text-white sm:text-[38px] lg:text-[44px]">
              A curadoria por trás
              <br />
              de cada projeto
            </h1>
            <p className="mt-5 text-[18px] font-medium leading-relaxed tracking-[-0.03em] text-[#D2A047] sm:text-[22px]">
              Conheça a equipe e o propósito da Atlas Hub.
            </p>
            {hasWhatsappSupport() ? (
              <WhatsappLink
                variant="hero"
                message="Olá! Gostaria de falar com a equipe da Atlas Hub."
                data-analytics-cta="quemsomos_hero_whatsapp"
                className="mt-8 !h-12 !w-fit rounded-[4px] !bg-[#D2A047] !px-6 !text-sm !font-semibold !text-white transition-opacity duration-200 hover:!opacity-90"
              >
                Fale com a nossa equipe
              </WhatsappLink>
            ) : (
              <a
                href="mailto:contato@atlashub.com.br"
                data-analytics-cta="quemsomos_hero_contato"
                className="mt-8 inline-flex h-12 items-center justify-center rounded-[4px] bg-[#D2A047] px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
              >
                Fale com a nossa equipe
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function NossoProposito(): ReactNode {
  return (
    <section
      className="relative bg-cover bg-center py-16 lg:py-24"
      style={{ backgroundImage: "url('/bg-nossoproposito.svg')" }}
      data-analytics-section="nosso-proposito"
    >
      <div className="lp-container">
        <AnimateIn className="max-w-4xl text-left">
          <h2 className="text-[36px] font-extrabold uppercase leading-[1.08] tracking-[-0.04em] text-[#6C4C14] sm:text-[44px] lg:text-[52px]">
            Nosso propósito
          </h2>
          <div className="mt-8 space-y-6 text-base font-medium leading-relaxed text-[#6C4C14] sm:text-lg lg:text-[19px]">
            <p>
              A AtlasHub conecta capital, ativos, projetos e oportunidades do mercado imobiliário, transformando boas ideias em negócios estruturados e capazes de gerar valor. Criamos pontes entre quem possui oportunidades e quem possui capital para viabilizá-las, oferecendo tecnologia, estrutura financeira, governança, transparência e acompanhamento em toda a jornada.
            </p>
            <p>
              Mais do que uma plataforma de captação, somos um ecossistema que amplia o acesso a diferentes formas de investir, financiar e gerar renda por meio do mercado imobiliário.
            </p>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}

export default function QuemSomosPage(): ReactNode {
  useLandingAnalytics(true);
  return (
    <MarketingShell>
      <QuemSomosHero />
      <NossoProposito />
    </MarketingShell>
  );
}
