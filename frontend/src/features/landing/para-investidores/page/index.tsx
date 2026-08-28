import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimateIn } from "@/components/animate-in";
import { WhatsappLink } from "@/components/shared/whatsapp-cta";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { ProjetosAtlas } from "@/features/landing/components/projetos-atlas";
import { useLandingAnalytics } from "@/lib/analytics/use-landing-analytics";

function InvestidoresHero(): ReactNode {
  return (
    <section
      className="relative overflow-visible bg-gradient-to-b from-[#D1D1D6] via-[#E7E7EA] via-40% to-white to-65% px-4 pb-[40px] pt-5 sm:px-6 lg:px-8"
      data-analytics-section="hero"
    >
      <div className="relative overflow-hidden rounded-[14px] bg-[#001F4E] shadow-[0_10px_30px_rgba(7,17,34,0.18)]">
        <img
          src="/bg-investidores.png"
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
          style={{ objectPosition: "right center" }}
        />
        <div className="lp-container relative flex min-h-[557px] items-center py-3 lg:min-h-[600px] lg:py-4">
          <div className="relative max-w-[680px]">
            <p className="mb-5 text-[11px] uppercase tracking-[0.32em] text-[#D2A047]">
              <span className="font-light">Para </span>
              <span className="font-semibold">investidores</span>
            </p>
            <h1 className="text-[36px] font-extrabold uppercase leading-[1.05] tracking-[0.04em] text-white sm:text-[42px] lg:text-[48px]">
              Diversifique com imóveis,
              <br />
              a partir de R$10
            </h1>
            <p className="mt-5 text-[20px] font-medium leading-snug tracking-[-0.04em] text-[#D2A047] sm:text-[24px]">
              Acesse projetos curados por especialistas.
            </p>
            <Link
              to="/cadastro"
              data-analytics-cta="inv_hero_cadastro"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-[4px] bg-[#D2A047] px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
            >
              Criar minha conta de investidor
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const INVESTIR_PASSOS = [
  { n: "01", desc: "Crie sua conta e complete seu cadastro de investidor." },
  { n: "02", desc: "Escolha um projeto entre os disponíveis na plataforma." },
  { n: "03", desc: "Aplique o valor desejado, a partir de R$10." },
  { n: "04", desc: "Acompanhe o andamento do projeto pela sua área logada." },
] as const;

function InvestirPassos(): ReactNode {
  return (
    <section className="bg-white py-14 lg:py-16" data-analytics-section="como-investir">
      <div className="lp-container flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
        <AnimateIn className="shrink-0 lg:w-[22%]">
          <h2 className="text-[40px] font-bold uppercase leading-[1.05] tracking-[-0.06em] text-navy sm:text-[44px] lg:text-[48px]">
            Como investir em
            <br />
            <span className="text-[#D2A047]">4 passos</span>
          </h2>
        </AnimateIn>
        <div className="grid flex-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {INVESTIR_PASSOS.map(({ n, desc }, i) => (
            <AnimateIn key={n} delay={i * 70} className="relative pt-8 pb-6">
              <div className="relative flex min-h-[9.2rem] flex-col items-center justify-center rounded-[14px] border-2 border-[#1C2E5E] bg-white px-4 pb-9 pt-8 text-center sm:min-h-[10rem]">
                <div
                  className="absolute -top-9 left-1/2 -translate-x-1/2 rounded-full border-[3px] border-[#1C2E5E] bg-white p-1.5"
                  aria-hidden
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1C2E5E] text-xl font-extrabold text-white">
                    {n}
                  </div>
                </div>
                <p className="text-[13px] font-semibold leading-snug text-[#1C2E5E] sm:text-sm">{desc}</p>
                <span
                  className="absolute -bottom-5 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#1C2E5E] bg-white"
                  aria-hidden
                >
                  <ChevronRight className="h-4 w-4 text-[#1C2E5E]" strokeWidth={2.5} />
                </span>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function CvmBanner(): ReactNode {
  return (
    <section className="bg-white pb-16 pt-0 lg:pb-20" data-analytics-section="cvm-banner">
      <div className="flex justify-center px-4">
        <AnimateIn className="w-[73%]">
          <div className="flex w-full flex-col items-start gap-5 rounded-[16px] bg-[#001F4E] px-6 py-[1.8rem] shadow-[0_8px_32px_rgb(0_0_0_/_0.12)] sm:flex-row sm:items-center sm:gap-7 sm:px-10 sm:py-9 lg:gap-9 lg:px-12">
            <svg width="93" height="89" viewBox="0 0 93 89" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[4.6rem] w-[4.8rem] shrink-0 sm:h-[5.5rem] sm:w-[5.8rem]" aria-hidden="true">
              <g clipPath="url(#clip0_40_5364)">
                <circle cx="27.5" cy="27.5" r="27.5" fill="#D9B366" />
                <path d="M28 28.0623C28.7563 28.0623 29.4036 27.7869 29.9422 27.2362C30.4807 26.6854 30.75 26.0233 30.75 25.2499C30.75 24.4764 30.4807 23.8143 29.9422 23.2636C29.4036 22.7128 28.7563 22.4374 28 22.4374C27.2437 22.4374 26.5964 22.7128 26.0578 23.2636C25.5193 23.8143 25.25 24.4764 25.25 25.2499C25.25 26.0233 25.5193 26.6854 26.0578 27.2362C26.5964 27.7869 27.2437 28.0623 28 28.0623ZM28 42.1246C24.3104 38.9137 21.5547 35.9314 19.7328 33.1775C17.9109 30.4236 17 27.8748 17 25.5311C17 22.0155 18.1057 19.2148 20.3172 17.1289C22.5286 15.043 25.0896 14 28 14C30.9104 14 33.4714 15.043 35.6828 17.1289C37.8943 19.2148 39 22.0155 39 25.5311C39 27.8748 38.0891 30.4236 36.2672 33.1775C34.4453 35.9314 31.6896 38.9137 28 42.1246Z" fill="#001F4E" />
              </g>
              <defs>
                <clipPath id="clip0_40_5364">
                  <rect width="93" height="89" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <div className="w-full min-w-0 flex-1 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[#D2A047] sm:text-[11px] sm:tracking-[0.48em]">
                Uma operação dentro das regras
              </p>
              <h2 className="mt-1.5 text-xl font-extrabold uppercase leading-tight tracking-[0.04em] text-white sm:text-2xl lg:text-[1.75rem]">
                Regulada pela CVM — Resolução 88
              </h2>
              <p className="mt-2.5 text-[0.74375rem] leading-relaxed text-white sm:text-[0.796875rem]">
                A Atlas Hub opera como plataforma de crowdfunding de investimento regulada pela Comissão de Valores Mobiliários, sob a Resolução CVM 88.
              </p>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}

function CentralDuvidas(): ReactNode {
  const btn =
    "inline-flex h-12 items-center justify-center rounded-[4px] bg-[#D2A047] px-[22px] text-[11px] font-semibold uppercase tracking-wide text-white transition-opacity duration-200 hover:opacity-90";

  return (
    <section id="central-duvidas" className="bg-white py-10 sm:py-12 lg:py-14" data-analytics-section="central-duvidas">
      <div className="lp-container grid items-center gap-6 lg:grid-cols-12 lg:gap-8">
        <AnimateIn className="flex justify-center lg:-mb-14 lg:col-span-5 lg:justify-start">
          <img
            src="/Mask%20group.svg"
            alt=""
            className="block h-auto w-full max-w-[26rem] object-contain lg:max-w-none"
          />
        </AnimateIn>
        <AnimateIn delay={80} className="lg:col-span-7 lg:pl-2 xl:pl-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[#D2A047]">
            Central de dúvidas
          </p>
          <h2 className="mt-4 text-[1.85rem] font-extrabold uppercase leading-[1.12] tracking-[0.12em] text-navy sm:text-4xl lg:text-[2.75rem]">
            Tire suas
            <br />
            principais
            <br />
            dúvidas
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-[#3A3A3A] sm:text-[0.95rem]">
            Encontre respostas para as principais dúvidas sobre investimentos, projetos e funcionamento da Atlas Hub
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/para-investidores" className={btn}>
              <span className="font-semibold">FAQ |</span>{" "}
              <span className="font-light">Investidor</span>
            </Link>
            <Link to="/para-incorporadoras" className={btn}>
              <span className="font-semibold">FAQ |</span>{" "}
              <span className="font-light">Incorporadora</span>
            </Link>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}

export default function ParaInvestidoresPage(): ReactNode {
  useLandingAnalytics(true);
  return (
    <MarketingShell>
      <InvestidoresHero />
      <InvestirPassos />
      <ProjetosAtlas />
      <CvmBanner />
      <CentralDuvidas />
    </MarketingShell>
  );
}
