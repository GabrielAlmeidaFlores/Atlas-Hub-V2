import { type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimateIn } from "@/components/animate-in";
import { WhatsappLink } from "@/components/shared/whatsapp-cta";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { CvmBanner } from "@/features/landing/components/cvm-banner";
import { ProjetosAtlas } from "@/features/landing/components/projetos-atlas";
import { useLandingAnalytics } from "@/lib/analytics/use-landing-analytics";

function InvestidoresHero(): ReactNode {
  const heroColor = "#001F4E";

  return (
    <section
      className="relative overflow-visible bg-gradient-to-b from-[#D1D1D6] via-[#E7E7EA] via-40% to-white to-65% px-4 pb-[40px] pt-5 sm:px-6 lg:px-8"
      data-analytics-section="hero"
    >
      <div className="relative overflow-hidden rounded-[14px] bg-[#001F4E] shadow-[0_10px_30px_rgba(7,17,34,0.18)]">
        <div className="relative min-h-[676px] overflow-hidden sm:hidden">
          <img
            src="/investidores-bg-mobile.png"
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
            <p className="mb-6 text-[11px] uppercase tracking-[0.32em] text-[#D2A047]">
              <span className="font-light">Para </span>
              <span className="font-semibold">investidores</span>
            </p>
            <h1 className="text-[30px] font-extrabold uppercase leading-[1.12] tracking-[0.04em]">
              INVISTA EM IMÓVEIS
              <br />
              A PARTIR DE R$10,
              <br />
              COM CURADORIA
              <br />
              PROFISSIONAL
            </h1>
            <p className="mt-5 text-[17px] font-medium leading-snug tracking-[-0.04em] text-[#D2A047]">
              Acesse projetos curados por especialistas.
            </p>
            <Link
              to="/cadastro"
              data-analytics-cta="inv_hero_cadastro"
              className="mt-8 flex h-12 w-full items-center justify-center rounded-[4px] bg-[#D2A047] px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
            >
              Quero investir
            </Link>
          </div>
        </div>

        <img
          src="/bg-investidores.png"
          alt=""
          className="absolute inset-0 hidden h-full w-full object-contain sm:block"
          style={{ objectPosition: "right center" }}
        />
        <div className="lp-container relative hidden min-h-[480px] items-center py-3 sm:flex lg:min-h-[600px] lg:py-4">
          <div className="relative max-w-[680px]">
            <p className="mb-5 text-[11px] uppercase tracking-[0.32em] text-[#D2A047]">
              <span className="font-light">Para </span>
              <span className="font-semibold">investidores</span>
            </p>
            <h1 className="text-[36px] font-extrabold uppercase leading-[1.05] tracking-[0.04em] text-white md:text-[42px] lg:text-[48px]">
              Diversifique com imóveis,
              <br />
              a partir de R$10
            </h1>
            <p className="mt-5 text-[20px] font-medium leading-snug tracking-[-0.04em] text-[#D2A047] lg:text-[24px]">
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
  { n: "01", desc: "Crie sua conta e complete seu cadastro de investidor.", color: "#3F629C" },
  { n: "02", desc: "Escolha um projeto entre os disponíveis na plataforma.", color: "#294574" },
  { n: "03", desc: "Aplique o valor desejado, a partir de R$10.", color: "#1C2E5E" },
  { n: "04", desc: "Acompanhe o andamento do projeto pela sua área logada.", color: "#161F48" },
] as const;

function InvestirPassos(): ReactNode {
  return (
    <section className="bg-white py-10 sm:py-14 lg:py-16" data-analytics-section="como-investir">
      <div className="lp-container flex flex-col gap-8 sm:gap-10 lg:flex-row lg:items-start lg:gap-10">
        <AnimateIn className="shrink-0 text-center lg:w-[22%] lg:text-left">
          <h2 className="text-[32px] font-bold uppercase leading-[1.05] tracking-[-0.06em] text-navy sm:text-[40px] lg:text-[48px]">
            Como investir
            <br />
            <span className="text-[#D2A047]">em 4 passos</span>
          </h2>
        </AnimateIn>
        <div className="flex flex-1 flex-col max-sm:gap-0 sm:grid sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
          {INVESTIR_PASSOS.map(({ n, desc, color }, i) => (
            <AnimateIn key={n} delay={i * 70} className="relative pt-9 pb-6 max-sm:pb-10 sm:pb-6">
              <div
                className="relative flex min-h-[9.2rem] flex-col items-center justify-center bg-white px-4 pb-9 pt-9 text-center max-sm:!border-[#1C2E5E] sm:min-h-[10rem]"
                style={{
                  borderRadius: "10px",
                  border: `2px solid ${color}`,
                }}
              >
                <div
                  className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white p-1 max-sm:!border-[#1C2E5E]"
                  style={{
                    borderRadius: "9999px",
                    border: `1.5px solid ${color}`,
                  }}
                  aria-hidden
                >
                  <div
                    className="flex h-[4.25rem] w-[4.25rem] items-center justify-center text-[31px] font-extrabold text-white max-sm:!bg-[#1C2E5E]"
                    style={{
                      borderRadius: "9999px",
                      backgroundColor: color,
                    }}
                  >
                    {n}
                  </div>
                </div>
                <p className="text-[13px] font-normal leading-snug text-navy sm:text-sm">{desc}</p>
                {i < INVESTIR_PASSOS.length - 1 && (
                  <>
                    <span
                      className="absolute -bottom-5 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center bg-white sm:hidden"
                      style={{
                        borderRadius: "9999px",
                        border: "2px solid #1C2E5E",
                      }}
                      aria-hidden
                    >
                      <ChevronDown className="h-5 w-5 text-[#1C2E5E]" strokeWidth={2.5} />
                    </span>
                    <span
                      className="absolute -bottom-5 left-1/2 hidden h-11 w-11 -translate-x-1/2 items-center justify-center bg-white xl:flex"
                      style={{
                        borderRadius: "9999px",
                        border: `2px solid ${color}`,
                      }}
                      aria-hidden
                    >
                      <ChevronRight className="h-5 w-5 text-[#1C2E5E]" strokeWidth={2.5} />
                    </span>
                  </>
                )}
              </div>
            </AnimateIn>
          ))}
        </div>
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
        <AnimateIn className="hidden justify-center lg:-mb-14 lg:col-span-5 lg:flex lg:justify-start">
          <img
            src="/Mask%20group.svg"
            alt=""
            className="block h-auto w-full max-w-[26rem] object-contain lg:max-w-none"
          />
        </AnimateIn>
        <AnimateIn delay={80} className="text-center lg:col-span-7 lg:pl-2 lg:text-left xl:pl-6">
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
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[#3A3A3A] sm:text-[0.95rem] lg:mx-0">
            Encontre respostas para as principais dúvidas sobre investimentos, projetos e funcionamento da Atlas Hub
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
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
      <div className="hidden sm:block">
        <ProjetosAtlas />
      </div>
      <CvmBanner />
      <CentralDuvidas />
    </MarketingShell>
  );
}
