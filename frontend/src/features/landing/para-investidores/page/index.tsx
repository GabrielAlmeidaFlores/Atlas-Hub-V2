import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { WhatsappLink } from "@/components/shared/whatsapp-cta";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { useLandingAnalytics } from "@/lib/analytics/use-landing-analytics";

function InvestidoresHero(): ReactNode {
  return (
    <section
      className="relative overflow-visible bg-gradient-to-b from-[#D1D1D6] via-[#E7E7EA] via-40% to-white to-65% px-4 pb-[40px] pt-5 sm:px-6 lg:px-8"
      data-analytics-section="hero"
    >
      <div className="relative overflow-hidden rounded-[14px] shadow-[0_10px_30px_rgba(7,17,34,0.18)]">
        <img
          src="/bg-investidores.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "right center" }}
        />
        <div className="lp-container relative flex min-h-[480px] items-center py-8 sm:min-h-[520px] lg:min-h-[557px] lg:py-4">
          <div className="relative max-w-[680px]">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#D2A047]">
              Para investidores
            </p>
            <h1 className="text-[36px] font-extrabold uppercase leading-[1.05] tracking-[0.04em] text-white sm:text-[42px] lg:text-[48px]">
              Diversifique com imóveis,
              <br />
              a partir de R$10
            </h1>
            <p className="mt-5 text-[18px] font-medium leading-snug tracking-[-0.04em] text-[#D2A047] sm:text-[20px]">
              Acesse projetos curados por especialistas.
            </p>
            <WhatsappLink variant="gold" className="mt-8">
              Criar minha conta de investidor
            </WhatsappLink>
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

export default function ParaInvestidoresPage(): ReactNode {
  useLandingAnalytics(true);
  return (
    <MarketingShell>
      <InvestidoresHero />
      <InvestirPassos />
    </MarketingShell>
  );
}
