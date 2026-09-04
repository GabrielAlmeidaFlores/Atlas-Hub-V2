import { type ReactNode, Fragment, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  TrendingUp,
  Banknote,
  FileCheck,
  Clock,
  Lock,
  Scale,
  BadgeCheck,
  Layers,
} from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { WhatsappLink } from "@/components/shared/whatsapp-cta";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { CvmBanner } from "@/features/landing/components/cvm-banner";
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
  const kpiItems = [
    { value: "CVM 88", label: "Operação regulada" },
    { value: "00", label: "Projetos avaliados" },
    { value: "00", label: "Captados" },
    { value: "00", label: "Incorporadoras parceiras" },
  ] as const;

  return (
    <>
      <section className="relative overflow-visible bg-gradient-to-b from-[#D1D1D6] via-[#E7E7EA] via-40% to-white to-65% px-4 pb-0 pt-5 sm:px-6 lg:px-8" data-analytics-section="hero">
        <div className="relative overflow-hidden rounded-[14px] bg-[#001F4E] shadow-[0_10px_30px_rgba(7,17,34,0.18)]">
          <img
            src="/banner-home%201.png"
            alt=""
            className="absolute inset-y-0 right-0 hidden h-full w-full object-cover opacity-95 sm:block"
            style={{ objectPosition: "center 20%", filter: "saturate(0.9) contrast(1.05) brightness(1.05)" }}
          />

          <div className="absolute inset-y-0 right-0 hidden w-[4%] bg-transparent lg:block" aria-hidden="true" />

          <div className="lp-container relative flex min-h-[520px] items-center py-[3.25rem] sm:min-h-[480px] sm:py-3 lg:min-h-[600px] lg:py-4">
            <div className="relative max-w-[760px] pb-10 text-left sm:pb-0">
              <p
                className="mb-8 text-[13px] uppercase tracking-[0.28em] text-[#D2A047] sm:mb-6 sm:text-[11px] sm:tracking-[0.32em]"
                style={{ animation: "lp-fade-in 0.35s ease-out both" }}
              >
                <span className="font-semibold">crowdfunding</span>
                <span className="font-light sm:ml-1"> imobiliário regulado pela CVM</span>
              </p>

              <h1
                className="mb-7 max-w-[760px] text-[34px] font-extrabold uppercase leading-[1.12] tracking-[0.04em] text-white sm:mb-5 sm:text-[36px] sm:leading-[1.08] md:text-[42px] lg:text-[48px]"
                style={{ animation: "lp-fade-in-up 0.38s 0.06s ease-out both" }}
              >
                INVISTA EM IMÓVEIS
                <br />
                A PARTIR DE R$10,
                <br />
                COM CURADORIA PROFISSIONAL
              </h1>

              <p
                className="mb-8 max-w-[680px] text-[19px] font-medium uppercase leading-[1.3] tracking-[-0.03em] text-[#D2A047] sm:mb-8 sm:normal-case sm:text-[20px] sm:leading-[1.2] sm:tracking-[-0.04em]"
                style={{ animation: "lp-fade-in-up 0.38s 0.12s ease-out both" }}
              >
                Ou capte recursos para o seu projeto sem depender de financiamento bancário
              </p>

              <p
                className="max-w-[820px] text-[15px] font-light leading-[1.5] tracking-[-0.02em] text-white sm:text-[14px] sm:leading-[1.35] sm:tracking-[-0.03em]"
                style={{ animation: "lp-fade-in-up 0.38s 0.18s ease-out both" }}
              >
                A Atlas Hub conecta investidores e incorporadoras em projetos imobiliários selecionados a dedo — com curadoria técnica de localização e viabilidade, e a segurança de uma plataforma regulada pela CVM.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-30 -mt-8 px-4 pb-5 pt-0 sm:-mt-[75px] sm:px-6 lg:px-8">
        <div className="lp-container">
          <div
            className="mx-auto flex w-full max-w-[82%] flex-col overflow-hidden rounded-[14px] bg-[linear-gradient(180deg,#E1C683_0%,#D2A047_100%)] py-1 text-[#6C4C14] shadow-[0_18px_28px_rgba(10,19,33,0.12),inset_0_1px_0_rgba(255,255,255,0.18)] sm:max-w-[77%] sm:flex sm:h-[136px] sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:bg-[linear-gradient(90deg,#D2A047_0%,#E1C683_100%)] sm:px-5 sm:py-0"
          >
            {kpiItems.map(({ value, label }, index) => (
              <Fragment key={label}>
                {index > 0 && (
                  <div className="flex justify-center sm:hidden" aria-hidden>
                    <div className="h-px w-[42%] bg-[#6C4C14]/30" />
                  </div>
                )}
                <div className="px-4 py-5 text-center sm:flex-1 sm:px-3 sm:py-0">
                  <p className="text-[28px] font-bold leading-none tracking-[-0.06em] sm:text-[32px]">{value}</p>
                  <p className="mt-2 text-[0.65rem] font-black uppercase tracking-[0.14em] text-[#6C4C14] sm:mt-2 sm:text-[0.73rem] sm:tracking-[0.18em]">
                    {label}
                  </p>
                </div>
              </Fragment>
            ))}
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
      mobileImage: "/investidores-mobile.png",
      description:
        "A partir de R$10. Sem taxa de entrada. Acompanhe o projeto até a entrega.",
      href: "/para-investidores",
      action: "Começar a investir",
      color: "#43669C",
      desktopColor: "#4169A1",
    },
    {
      title: "INCORPORADORA",
      image: "/incorporadora.png",
      mobileImage: "/incorporadora-mobile.png",
      description:
        "Análise em até X dias. Captação de recursos sem financiamento bancário.",
      href: "/para-incorporadoras",
      action: "Apresentar meu projeto",
      color: "#192145",
      desktopColor: "#1C285B",
    },
  ] as const;

  return (
    <section id="sobre" className="bg-white py-10 sm:py-14 lg:py-16">
      <div className="lp-container">
        <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row">
          {profiles.map(({ title, image, mobileImage, description, href, action, color, desktopColor }) => (
            <div key={title} className="group min-w-0 flex-1 overflow-hidden rounded-[14px]">
              <div className="relative min-h-[500px] overflow-hidden sm:hidden">
                <img
                  src={mobileImage ?? image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-[center_72%]"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, ${color} 0%, ${color} 24%, ${color}eb 32%, ${color}d4 38%, ${color}b8 44%, ${color}8f 50%, ${color}66 56%, ${color}40 62%, ${color}1a 68%, transparent 76%)`,
                  }}
                  aria-hidden
                />
                <div className="relative z-10 px-6 pb-14 pt-10 text-center text-white">
                  <h3 className="text-[32px] font-black uppercase leading-[1.05] tracking-[-0.04em]">
                    SOU
                    <br />
                    {title}
                  </h3>
                  <p className="mx-auto mt-4 max-w-[300px] text-[13px] font-normal leading-[1.5]">{description}</p>
                  <Link
                    to={href}
                    className="mt-6 inline-flex h-12 items-center justify-center rounded-[4px] bg-[#D2A047] px-7 text-[14px] font-bold text-white transition-colors duration-200 hover:bg-[#C49020]"
                  >
                    {action}
                  </Link>
                </div>
              </div>

              <div className="relative hidden min-h-[280px] overflow-hidden sm:block sm:aspect-[2.12] sm:min-h-[300px]">
                <img src={image} alt="" className="absolute inset-0 h-full w-full object-contain object-right" />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(90deg, ${desktopColor} 0%, ${desktopColor} 60%, ${desktopColor}55 65%, transparent 100%)`,
                  }}
                  aria-hidden
                />
                <div className="relative z-10 flex h-full max-w-full flex-col justify-center px-6 py-8 text-white sm:max-w-[62%] sm:px-10 lg:px-14">
                  <h3 className="text-[28px] font-black uppercase leading-[1.05] tracking-[-0.04em] sm:text-[32px] lg:text-[40px]">
                    SOU
                    <br />
                    {title}
                  </h3>
                  <p className="mt-4 max-w-[350px] text-[12px] font-normal leading-[1.5]">{description}</p>
                  <Link
                    to={href}
                    className="mt-6 inline-flex h-12 w-fit items-center justify-center rounded-[4px] bg-[#D2A047] px-7 text-[14px] font-bold text-white transition-colors duration-200 hover:bg-[#C49020]"
                  >
                    {action}
                  </Link>
                </div>
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
          <h2 className="text-[32px] font-bold uppercase leading-[1.05] tracking-[-0.07em] text-navy sm:text-[40px] lg:text-[52px]">
            COMO
            <br />
            FUNCIONA A
            <br />
            ATLAS HUB
          </h2>
          <p className="mt-4 text-[18px] font-medium leading-[1.1] tracking-[-0.04em] text-[#D2A047] sm:mt-5 sm:text-[22.1px] lg:text-[23.8px]">
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

function CuradoriaIcon({ title }: { readonly title: string }): ReactNode {
  if (title === "Localização") {
    return (
      <svg className="h-11 w-11 shrink-0 lg:h-[55px] lg:w-[55px]" viewBox="0 0 55 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="27.5" cy="27.5" r="27.5" fill="#D9B366" />
        <path d="M28 28.0623C28.7563 28.0623 29.4036 27.7869 29.9422 27.2362C30.4807 26.6854 30.75 26.0233 30.75 25.2499C30.75 24.4764 30.4807 23.8143 29.9422 23.2636C29.4036 22.7128 28.7563 22.4374 28 22.4374C27.2437 22.4374 26.5964 22.7128 26.0578 23.2636C25.5193 23.8143 25.25 24.4764 25.25 25.2499C25.25 26.0233 25.5193 26.6854 26.0578 27.2362C26.5964 27.7869 27.2437 28.0623 28 28.0623ZM28 42.1246C24.3104 38.9137 21.5547 35.9314 19.7328 33.1775C17.9109 30.4236 17 27.8748 17 25.5311C17 22.0155 18.1057 19.2148 20.3172 17.1289C22.5286 15.043 25.0896 14 28 14C30.9104 14 33.4714 15.043 35.6828 17.1289C37.8943 19.2148 39 22.0155 39 25.5311C39 27.8748 38.0891 30.4236 36.2672 33.1775C34.4453 35.9314 31.6896 38.9137 28 42.1246Z" fill="#294574" />
      </svg>
    );
  }
  if (title === "Viabilidade") {
    return (
      <svg className="h-11 w-11 shrink-0 lg:h-[55px] lg:w-[55px]" viewBox="0 0 55 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="27.5" cy="27.5" r="27.5" fill="#D9B366" />
        <path d="M36 38.0935V24.9101M28 38.0935V17M20 38.0935V30.1834" stroke="#1C2E5E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="h-11 w-11 shrink-0 lg:h-[55px] lg:w-[55px]" viewBox="0 0 55 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
  );
}

function Curadoria(): ReactNode {
  const cards = [
    {
      title: "Localização",
      desc: "Avaliamos a região e o entorno do empreendimento.",
      offset: "lg:mt-0",
      bg: "#294574",
    },
    {
      title: "Viabilidade",
      desc: "Potencial de retorno e solidez financeira do projeto.",
      offset: "lg:mt-10",
      bg: "#1C2E5E",
    },
    {
      title: "Solidez",
      desc: "Histórico e capacidade técnica da incorporadora.",
      offset: "lg:mt-0",
      bg: "#161F48",
    },
  ] as const;

  return (
    <section id="curadoria" className="bg-white pt-10 sm:pt-16 lg:pt-20" data-analytics-section="curadoria">
      <div className="lp-container pb-8 sm:pb-12 lg:pb-16">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-10">
          <AnimateIn className="text-left lg:col-span-5 lg:pt-6">
            <h2 className="text-[26px] font-extrabold uppercase leading-[1.08] tracking-tight text-navy sm:text-[2.5rem] lg:text-[3rem]">
              Cada projeto
              <br />
              passa por uma
              <br />
              curadoria
            </h2>
            <p className="mt-3 text-base font-medium lowercase text-[#D2A047] sm:text-lg">
              antes de chegar até você.
            </p>
            <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-[#3A3A3A]">
              Analisamos a localização do empreendimento, o potencial de retorno e a viabilidade técnica e financeira de cada projeto antes de abri-lo para captação. Só entram na plataforma os projetos que passam por esse crivo.
            </p>
          </AnimateIn>

          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-3 sm:gap-4 lg:col-span-7 lg:w-[110%] lg:max-w-none lg:gap-5 max-lg:w-full">
            {cards.map(({ title, desc, offset, bg }, i) => (
              <AnimateIn key={title} delay={i * 80} className={offset}>
                <div
                  className="flex flex-row items-center gap-4 rounded-[12px] px-4 py-5 text-left sm:flex-col sm:items-center sm:px-7 sm:py-7 sm:text-center"
                  style={{ backgroundColor: bg }}
                >
                  <CuradoriaIcon title={title} />
                  <div className="min-w-0">
                    <h3 className="text-[18px] font-bold tracking-wide text-[#D2A047] sm:text-[24px] lg:mt-4">{title}</h3>
                    <p className="mt-1 text-[12px] leading-snug text-white/90 sm:mt-2 sm:text-sm">{desc}</p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Parceiros(): ReactNode {
  const logos = [
    { src: "/divify.svg", alt: "Divify", className: "h-10 w-auto max-w-[10rem] object-contain sm:h-[3.3rem] sm:max-w-[11.4rem]" },
    { src: "/advogados.svg", alt: "Wilson & Pinheiro Advogados", className: "h-14 w-auto max-w-[12.5rem] object-contain sm:h-[4.8rem] sm:max-w-[11.4rem]" },
    { src: "/swiss.svg", alt: "Swiss Capital", className: "h-12 w-auto max-w-[9rem] object-contain sm:h-[5.4rem] sm:max-w-[8.4rem]" },
  ];

  return (
    <section className="bg-[#D9B366] py-12 sm:py-10 lg:py-12" data-analytics-section="parceiros">
      <div className="lp-container flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <AnimateIn className="w-full max-w-md shrink-0 text-center lg:text-left">
          <h2 className="text-[1.65rem] font-extrabold uppercase leading-tight tracking-tight text-[#6C4C14] sm:text-3xl lg:text-[1.95rem]">
            Quem constrói
            <br />
            com a Atlas Hub
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[#6C4C14]/90 sm:mt-3 sm:max-w-md sm:text-[0.9375rem]">
            Uma rede de parceiros que compartilha conhecimento, experiência e oportunidades.
          </p>
        </AnimateIn>
        <AnimateIn delay={80} className="flex w-full max-w-sm flex-col items-center gap-7 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-10 lg:justify-start">
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
      <div className="relative min-h-[20rem] overflow-hidden bg-[#121A3E] sm:min-h-[26.4rem] lg:min-h-[29rem]">
        <div className="absolute inset-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[55%] lg:w-[52%]">
          <img
            src="/banner-mulher.png"
            alt=""
            className="h-full w-full object-cover object-center opacity-50 sm:opacity-100"
          />
        </div>
        <div
          className="absolute inset-0 bg-[#121A3E]/90 sm:hidden"
          aria-hidden
        />
        <div
          className="absolute inset-0 hidden sm:block"
          style={{
            background:
              "linear-gradient(90deg, #121A3E 0%, #121A3E 38%, rgb(18 26 62 / 0.92) 48%, rgb(18 26 62 / 0.55) 62%, transparent 82%)",
          }}
        />
        <div className="lp-container relative z-10 flex min-h-[20rem] items-center py-10 sm:min-h-[26.4rem] sm:py-[3.6rem] lg:min-h-[29rem] lg:py-[4.2rem]">
          <AnimateIn className="max-w-md">
            <h2 className="text-3xl font-extrabold uppercase leading-tight tracking-tight text-[#D2A047] sm:text-5xl lg:text-[3rem]">
              Pronto para começar?
            </h2>
            <p className="mt-4 max-w-md text-base font-medium leading-relaxed text-white sm:text-lg lg:text-xl">
              Crie sua conta e invista no seu primeiro projeto em poucos minutos.
            </p>
            <Link
              to="/para-investidores"
              data-analytics-cta="final_investir"
              className="mt-7 inline-flex h-12 items-center justify-center rounded-[4px] bg-[#D2A047] px-[26px] text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
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
      <ProjetosAtlas
        viewAllProjectsOnMobile
        shellClassName="max-sm:![background-image:url('/elemento-projetos.png')] max-sm:!bg-[length:100%_auto] bg-bottom bg-no-repeat"
      />
      <Curadoria />
      <CvmBanner />
      <Parceiros />
      <CentralDuvidas />
      <CtaFinal />
    </MarketingShell>
  );
}
