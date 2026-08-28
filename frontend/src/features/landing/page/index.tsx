import { type ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  ChevronDown,
  TrendingUp,
  Banknote,
  FileCheck,
  Clock,
  Building2,
  BarChart3,
  Lock,
  Scale,
  BadgeCheck,
  Layers,
  MapPin,
} from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { WhatsappLink } from "@/components/shared/whatsapp-cta";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { ProjetosAtlas } from "@/features/landing/components/projetos-atlas";
import { hasWhatsappSupport } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { useLandingAnalytics } from "@/lib/analytics/use-landing-analytics";

function ScrollToHash(): ReactNode {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);
  return null;
}

function Hero(): ReactNode {
  return (
    <>
      <section className="relative overflow-visible bg-gradient-to-b from-[#D1D1D6] via-[#E7E7EA] via-40% to-white to-65% px-4 pb-0 pt-5 sm:px-6 lg:px-8" data-analytics-section="hero">
        <div className="relative overflow-hidden rounded-[14px] bg-transparent shadow-[0_10px_30px_rgba(7,17,34,0.18)]">
          <img
            src="/banner-home%201.png"
            alt="Investidores e incorporadoras"
            className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-95"
            style={{ objectPosition: "center 20%", filter: "saturate(0.9) contrast(1.05) brightness(1.05)" }}
          />

          <div className="absolute inset-y-0 right-0 hidden w-[4%] bg-transparent lg:block" aria-hidden="true" />

          <div className="lp-container relative flex min-h-[557px] items-center py-3 lg:min-h-[600px] lg:py-4">
            <div className="relative max-w-[760px] pb-3 pt-1 lg:pb-4">
              <p className="mb-6 text-[11px] uppercase tracking-[0.32em] text-[#D2A047]" style={{ animation: "lp-fade-in 0.35s ease-out both" }}>
                <span className="font-semibold">crowdfunding</span>
                <span className="ml-1 font-light">imobiliário regulado pela CVM</span>
              </p>

              <h1
                className="mb-5 max-w-[760px] text-[48px] font-extrabold uppercase leading-[0.95] tracking-[0.04em] text-white"
                style={{ animation: "lp-fade-in-up 0.38s 0.06s ease-out both" }}
              >
                INVISTA EM IMÓVEIS
                <br />
                A PARTIR DE R$10,
                <br />
                COM CURADORIA PROFISSIONAL
              </h1>

              <p
                className="mb-8 max-w-[680px] text-[20px] font-medium leading-[1.12] tracking-[-0.04em] text-[#D2A047]"
                style={{ animation: "lp-fade-in-up 0.38s 0.12s ease-out both" }}
              >
                Ou capte recursos para o seu projeto
                <br />
                sem depender de financiamento bancário
              </p>

              <p
                className="max-w-[820px] text-[14px] font-light leading-[1.25] tracking-[-0.03em] text-white"
                style={{ animation: "lp-fade-in-up 0.38s 0.18s ease-out both" }}
              >
                A Atlas Hub conecta investidores e incorporadoras em projetos imobiliários
                <br />
                selecionados a dedo — com curadoria técnica de localização e viabilidade,
                <br />
                e a segurança de uma plataforma regulada pela CVM.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-30 -mt-[75px] px-4 pb-5 pt-0 sm:px-6 lg:px-8">
        <div className="lp-container">
          <div className="mx-auto flex h-[136px] w-full max-w-[77%] items-center justify-between gap-5 rounded-[14px] bg-[linear-gradient(90deg,#D2A047_0%,#E1C683_100%)] px-5 py-0 text-[#6C4C14] shadow-[0_18px_28px_rgba(10,19,33,0.12),inset_0_1px_0_rgba(255,255,255,0.18)]">
            <div className="flex-1 px-3 text-center">
              <p className="text-[32px] font-bold leading-none tracking-[-0.06em]">CVM 88</p>
              <p className="mt-2 text-[0.73rem] font-black uppercase tracking-[0.18em] text-[#6C4C14]">Operação regulada</p>
            </div>
            <div className="flex-1 px-3 text-center">
              <p className="text-[32px] font-bold leading-none tracking-[-0.06em]">00</p>
              <p className="mt-2 text-[0.73rem] font-black uppercase tracking-[0.18em] text-[#6C4C14]">Projetos avaliados</p>
            </div>
            <div className="flex-1 px-3 text-center">
              <p className="text-[32px] font-bold leading-none tracking-[-0.06em]">00</p>
              <p className="mt-2 text-[0.73rem] font-black uppercase tracking-[0.18em] text-[#6C4C14]">Captados</p>
            </div>
            <div className="flex-1 px-3 text-center">
              <p className="text-[32px] font-bold leading-none tracking-[-0.06em]">00</p>
              <p className="mt-2 text-[0.73rem] font-black uppercase tracking-[0.18em] text-[#6C4C14]">Incorporadoras parceiras</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Ecossistema(): ReactNode {
  const profiles = [
    {
      title: "INVESTIDOR",
      image: "/investidor.png",
      description:
        "A partir de R$10. Sem taxa de entrada. Acompanhe o projeto até a entrega.",
      href: "/para-investidores",
      action: "Começar a investir",
      color: "#4169A1",
    },
    {
      title: "INCORPORADORA",
      image: "/incorporadora.png",
      description:
        "Análise em até X dias. Captação de recursos sem financiamento bancário.",
      href: "/para-incorporadoras",
      action: "Apresentar meu projeto",
      color: "#1C285B",
    },
  ];

  return (
    <section id="sobre" className="bg-white py-14 lg:py-16">
      <div className="lp-container">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-8">
          {profiles.map(({ title, image, description, href, action, color }, i) => (
            <div
              key={title}
              className="group relative min-w-0 flex-1 basis-0 aspect-[2.12] min-h-[300px] overflow-hidden rounded-[14px]"
            >
              <img src={image} alt="" className="absolute inset-0 h-full w-full object-contain object-right" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${color} 0%, ${color} 50%, ${color}55 55%, transparent 100%)` }} />
              <div className="relative flex h-full max-w-[58%] flex-col justify-center px-8 py-8 text-white sm:px-12 lg:px-14">
                <h3 className="text-[32px] font-black uppercase leading-[1.05] tracking-[-0.04em] sm:text-[40px]">
                  SOU
                  <br />
                  {title}
                </h3>
                <p className="mt-4 max-w-[350px] text-[13px] font-normal leading-[1.5] text-white sm:text-[12px]">{description}</p>
                <Link to={href} className="mt-6 inline-flex min-h-[48px] w-fit items-center justify-center rounded-[4px] bg-[#D2A047] px-7 text-[14px] font-bold text-white transition-colors duration-200 hover:bg-[#C49020]">
                  {action}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComoFunciona(): ReactNode {
  const steps = [
    { number: "01", title: "PROJETO\nAPRESENTADO", desc: "a incorporadora apresenta o projeto", color: "#3F629C" },
    { number: "02", title: "CURADORIA\nTÉCNICA", desc: "analisamos localização, viabilidade e retorno", color: "#294574" },
    { number: "03", title: "PUBLICAÇÃO", desc: "o projeto entra em captação na plataforma", color: "#1C2E5E" },
    { number: "04", title: "ACOMPANHAMENTO", desc: "a incorporadora apresenta o projeto", color: "#161F48" },
  ];

  return (
    <section id="como-funciona" className="bg-white py-14 lg:py-16" data-analytics-section="como-funciona">
      <div className="lp-container flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-10">
        <AnimateIn className="lg:w-[24%]">
          <h2 className="text-[52px] font-bold uppercase leading-[1.05] tracking-[-0.07em] text-navy md:text-[52px] lg:text-[52px]">
            COMO
            <br />
            FUNCIONA A
            <br />
            ATLAS HUB
          </h2>
          <p className="mt-5 text-[22.1px] font-medium leading-[1.05] tracking-[-0.04em] text-[#D2A047] md:text-[23.8px]">
            do projeto ao investimento, em quatro passos
          </p>
        </AnimateIn>

        <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map(({ number, title, desc, color }) => (
            <div key={title} className="min-w-0 break-words rounded-[14px] p-5 text-white shadow-[0_10px_20px_rgba(15,23,42,0.04)]" style={{ backgroundColor: color }}>
              <div className="relative h-[98px]">
                <span className="absolute -top-2 right-0 text-[79px] font-bold leading-none tracking-[0.03em] text-black/10" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {number}
                </span>
              </div>
              <h3 className="mt-2 text-[15px] font-bold uppercase leading-[1.02] tracking-[0.08em] text-white">
                {title.split("\n").map((line, idx) => (
                  <span key={`${title}-${idx}`} className="block">
                    {line}
                  </span>
                ))}
              </h3>
              <p className="mt-4 text-[14px] font-normal leading-[1.35] tracking-[-0.03em] text-white/90">{desc}</p>
            </div>
          ))}
        </div>
        </div>
    </section>
  );
}

function Curadoria(): ReactNode {
  const cards = [
    {
      icon: MapPin,
      title: "Localização",
      desc: "Avaliamos a região e o entorno do empreendimento.",
      offset: "lg:mt-0",
      bg: "#294574",
    },
    {
      icon: BarChart3,
      title: "Viabilidade",
      desc: "Potencial de retorno e solidez financeira do projeto.",
      offset: "lg:mt-10",
      bg: "#1C2E5E",
    },
    {
      icon: Building2,
      title: "Solidez",
      desc: "Histórico e capacidade técnica da incorporadora.",
      offset: "lg:mt-0",
      bg: "#161F48",
    },
  ];

  return (
    <section id="curadoria" className="bg-white pt-16 lg:pt-20" data-analytics-section="curadoria">
      <div className="lp-container pb-12 lg:pb-16">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-10">
          <AnimateIn className="lg:col-span-5 lg:pt-6">
            <h2 className="text-[2.5rem] font-extrabold uppercase leading-[1.05] tracking-tight text-navy sm:text-[2.75rem] lg:text-[3rem]">
              Cada projeto
              <br />
              passa por uma
              <br />
              curadoria
            </h2>
            <p className="mt-3 text-base font-medium text-[#D2A047] sm:text-lg">
              antes de chegar até você.
            </p>
            <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-[#3A3A3A]">
              Analisamos a localização do empreendimento, o potencial de retorno e a viabilidade técnica e financeira de cada projeto antes de abri-lo para captação. Só entram na plataforma os projetos que passam por esse crivo.
            </p>
          </AnimateIn>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7 lg:w-[110%] lg:gap-5">
            {cards.map(({ icon: Icon, title, desc, offset, bg }, i) => (
              <AnimateIn key={title} delay={i * 80} className={offset}>
                <div
                  className="flex flex-col items-center rounded-[12px] px-4 py-4 text-center sm:px-5 sm:py-5"
                  style={{ backgroundColor: bg }}
                >
                  {title === "Localização" ? (
                    <svg width="55" height="55" viewBox="0 0 55 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <circle cx="27.5" cy="27.5" r="27.5" fill="#D9B366" />
                      <path d="M28 28.0623C28.7563 28.0623 29.4036 27.7869 29.9422 27.2362C30.4807 26.6854 30.75 26.0233 30.75 25.2499C30.75 24.4764 30.4807 23.8143 29.9422 23.2636C29.4036 22.7128 28.7563 22.4374 28 22.4374C27.2437 22.4374 26.5964 22.7128 26.0578 23.2636C25.5193 23.8143 25.25 24.4764 25.25 25.2499C25.25 26.0233 25.5193 26.6854 26.0578 27.2362C26.5964 27.7869 27.2437 28.0623 28 28.0623ZM28 42.1246C24.3104 38.9137 21.5547 35.9314 19.7328 33.1775C17.9109 30.4236 17 27.8748 17 25.5311C17 22.0155 18.1057 19.2148 20.3172 17.1289C22.5286 15.043 25.0896 14 28 14C30.9104 14 33.4714 15.043 35.6828 17.1289C37.8943 19.2148 39 22.0155 39 25.5311C39 27.8748 38.0891 30.4236 36.2672 33.1775C34.4453 35.9314 31.6896 38.9137 28 42.1246Z" fill="#294574" />
                    </svg>
                  ) : title === "Viabilidade" ? (
                    <svg width="55" height="55" viewBox="0 0 55 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <circle cx="27.5" cy="27.5" r="27.5" fill="#D9B366" />
                      <path d="M36 38.0935V24.9101M28 38.0935V17M20 38.0935V30.1834" stroke="#1C2E5E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : title === "Solidez" ? (
                    <svg width="55" height="55" viewBox="0 0 55 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <circle cx="27.5" cy="27.5" r="27.5" fill="#D9B366" />
                      <g clipPath="url(#clip0_37_5257)">
                        <path d="M27.1448 15.2598C27.6428 14.9134 28.3572 14.9134 28.8767 15.2598L40.2423 22.577C40.8484 22.9883 41.1515 23.7027 40.9567 24.3955C40.7618 25.0883 40.0907 25.5645 39.3763 25.5645H37.7527V36.1291L40.3505 38.0558C40.7618 38.3589 41 38.8784 41 39.3764C41 40.2856 40.2856 41 39.3763 41H16.6453C15.7144 41 15 40.2856 15 39.3764C15 38.8784 15.2598 38.3589 15.6494 38.0558L18.2473 36.1291V25.5645H16.6236C15.9092 25.5645 15.2598 25.1099 15.0433 24.3955C14.8268 23.6811 15.1515 22.9667 15.7577 22.577L27.1448 15.2598ZM20.6936 25.5645V36.1291H23.9408V25.5645H20.6936ZM26.3871 36.1291H29.6344V25.5645H26.3871V36.1291ZM32.0591 25.5645V36.1291H35.3064V25.5645H32.0591Z" fill="#161F48" />
                      </g>
                      <defs>
                        <clipPath id="clip0_37_5257">
                          <rect width="26" height="26" fill="white" transform="translate(15 15)" />
                        </clipPath>
                      </defs>
                    </svg>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D2A047]/40 bg-[#D2A047]/10">
                      <Icon className="h-5 w-5 text-[#D2A047]" strokeWidth={1.75} />
                    </div>
                  )}
                  <h3 className="mt-4 text-[24px] font-bold tracking-wide text-[#D2A047]">{title}</h3>
                  <p className="mt-2 text-xs leading-snug text-white/90 sm:text-sm">{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CvmBanner(): ReactNode {
  return (
    <section className="bg-white pb-16 pt-0 lg:pb-20" data-analytics-section="cvm-banner">
      <div className="flex justify-center px-4">
        <AnimateIn className="w-[80%]">
          <div className="flex w-full flex-col items-start gap-5 rounded-[16px] bg-[#001F4E] px-6 py-[1.8rem] shadow-[0_8px_32px_rgb(0_0_0_/_0.12)] sm:flex-row sm:items-center sm:gap-7 sm:px-10 sm:py-9 lg:gap-9 lg:px-12">
            <ShieldCheck className="h-[3.6rem] w-[3.6rem] shrink-0 text-[#D2A047] sm:h-[4.5rem] sm:w-[4.5rem]" strokeWidth={1.25} />
            <div className="w-full min-w-0 flex-1 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[#D2A047] sm:text-[11px] sm:tracking-[0.48em]">
                Uma operação dentro das regras
              </p>
              <h2 className="mt-1.5 text-xl font-extrabold uppercase leading-tight tracking-[0.04em] text-white sm:text-2xl lg:text-[1.75rem]">
                Regulada pela CVM — Resolução 88
              </h2>
              <p className="mt-2.5 text-[0.74375rem] leading-relaxed text-white/90 sm:text-[0.796875rem]">
                A Atlas Hub opera como plataforma de crowdfunding de investimento regulada pela Comissão de Valores Mobiliários, sob a Resolução CVM 88.
              </p>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}

function Parceiros(): ReactNode {
  const logos = [
    { src: "/divify.svg", alt: "Divify", className: "h-12 w-auto max-w-[11.4rem] object-contain sm:h-[3.3rem]" },
    { src: "/advogados.svg", alt: "Wilson & Pinheiro Advogados", className: "h-[4.2rem] w-auto max-w-[11.4rem] object-contain sm:h-[4.8rem]" },
    { src: "/swiss.svg", alt: "Swiss Capital", className: "h-[4.8rem] w-auto max-w-[8.4rem] object-contain sm:h-[5.4rem]" },
    { src: "/starkbank.svg", alt: "Stark Bank", className: "h-9 w-auto max-w-[10.5rem] object-contain sm:h-10" },
  ];

  return (
    <section className="bg-[#D2A047] py-10 lg:py-12" data-analytics-section="parceiros">
      <div className="lp-container flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <AnimateIn className="max-w-md shrink-0 text-center lg:text-left">
          <h2 className="text-xl font-extrabold uppercase leading-tight tracking-tight text-[#6C4C14] sm:text-2xl lg:text-[1.65rem]">
            Quem constrói com a Atlas Hub
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#6C4C14]/90 sm:text-[0.9375rem]">
            Uma rede de parceiros que compartilha conhecimento, experiência e oportunidades.
          </p>
        </AnimateIn>
        <AnimateIn delay={80} className="flex flex-wrap items-center justify-center gap-8 sm:gap-10 lg:justify-end">
          {logos.map(({ src, alt, className }) => (
            <img key={alt} src={src} alt={alt} className={className} />
          ))}
        </AnimateIn>
      </div>
    </section>
  );
}

function CentralDuvidas(): ReactNode {
  const btn =
    "inline-flex h-10 items-center justify-center rounded-[4px] bg-[#D2A047] px-5 text-[11px] font-semibold uppercase tracking-wide text-white transition-opacity duration-200 hover:opacity-90";

  return (
    <section id="central-duvidas" className="bg-white py-10 sm:py-12 lg:py-14" data-analytics-section="central-duvidas">
      <div className="lp-container grid items-center gap-6 lg:grid-cols-12 lg:gap-8">
        <AnimateIn className="flex justify-center lg:col-span-5 lg:justify-start">
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

function CtaFinal(): ReactNode {
  return (
    <section className="bg-white pb-0 pt-0" data-analytics-section="cta-final">
      <div className="relative min-h-[21.6rem] overflow-hidden bg-[#121A3E] sm:min-h-[24rem] lg:min-h-[26.4rem]">
        <div className="absolute inset-y-0 right-0 w-[58%] sm:w-[55%] lg:w-[52%]">
          <img
            src="/banner-mulher.png"
            alt=""
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #121A3E 0%, #121A3E 38%, rgb(18 26 62 / 0.92) 48%, rgb(18 26 62 / 0.55) 62%, transparent 82%)",
          }}
        />
        <div className="lp-container relative z-10 flex min-h-[21.6rem] items-center py-[3.6rem] sm:min-h-[24rem] lg:min-h-[26.4rem] lg:py-[4.2rem]">
          <AnimateIn className="max-w-md">
            <h2 className="text-3xl font-extrabold uppercase leading-tight tracking-tight text-[#D2A047] sm:text-4xl lg:text-[2.75rem]">
              Pronto para começar?
            </h2>
            <p className="mt-4 max-w-md text-lg font-medium leading-relaxed text-white sm:text-xl">
              Crie sua conta e invista no seu primeiro projeto em poucos minutos.
            </p>
            <Link
              to="/para-investidores"
              data-analytics-cta="final_investir"
              className="mt-7 inline-flex h-10 items-center justify-center rounded-[4px] bg-[#D2A047] px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
            >
              Quero investir
            </Link>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage(): ReactNode {
  useLandingAnalytics(true);
  return (
    <MarketingShell>
      <ScrollToHash />
      <Hero />
      <ComoFunciona />
      <Ecossistema />
      <ProjetosAtlas />
      <Curadoria />
      <CvmBanner />
      <Parceiros />
      <CentralDuvidas />
      <CtaFinal />
    </MarketingShell>
  );
}
