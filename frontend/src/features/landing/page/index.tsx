import { type ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
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
        <div className="relative overflow-hidden rounded-[14px] bg-[#001F4E] shadow-[0_10px_30px_rgba(7,17,34,0.18)]">
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
                <Link to={href} className="mt-6 inline-flex h-12 w-fit items-center justify-center rounded-[4px] bg-[#D2A047] px-7 text-[14px] font-bold text-white transition-colors duration-200 hover:bg-[#C49020]">
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
                  className="flex flex-col items-center rounded-[12px] px-6 py-6 text-center sm:px-7 sm:py-7"
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
        <AnimateIn className="w-[73%]">
          <div className="flex w-full flex-col items-start gap-5 rounded-[16px] bg-[#001F4E] px-6 py-[1.8rem] shadow-[0_8px_32px_rgb(0_0_0_/_0.12)] sm:flex-row sm:items-center sm:gap-7 sm:px-10 sm:py-9 lg:gap-9 lg:px-12">
            <svg width="93" height="89" viewBox="0 0 93 89" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[4.6rem] w-[4.8rem] shrink-0 sm:h-[5.5rem] sm:w-[5.8rem]" aria-hidden="true">
              <g clipPath="url(#clip0_40_5364)">
                <path d="M62.3359 29.8081C63.3367 30.5945 63.5511 32.0242 62.8363 33.025L44.608 58.0451C44.1791 58.5455 43.6072 58.9029 42.9639 58.9744C42.249 58.9744 41.6057 58.76 41.1053 58.331L32.0269 49.2523C31.1691 48.323 31.1691 46.8933 32.0269 45.964C32.9562 45.1061 34.3859 45.1061 35.3151 45.964L42.4635 53.184L59.1191 30.3085C59.9054 29.3077 61.3351 29.0933 62.3359 29.8081Z" fill="#D2A047" />
                <path d="M42.8209 59.8322C42.0346 59.8322 41.2483 59.5462 40.6049 58.9744L31.455 49.8242C30.2398 48.5374 30.2398 46.5358 31.455 45.3205C32.7417 44.1053 34.7433 44.1053 35.9585 45.3205L42.4635 51.8258L58.4758 29.8081C59.548 28.3784 61.4781 28.0924 62.9078 29.0932C64.2659 30.237 64.5519 32.1671 63.5511 33.5254L45.3228 58.5454C44.6795 59.3318 43.8931 59.7607 43.0353 59.8322C42.9639 59.8322 42.8209 59.8322 42.7494 59.8322H42.8209ZM33.671 46.1784C33.3136 46.1784 32.9562 46.3213 32.5988 46.6073C32.0984 47.1077 32.0984 48.037 32.5988 48.6089L41.6772 57.6876C41.6772 57.6876 42.3205 58.1165 42.8209 58.045C43.1783 58.045 43.5357 57.7591 43.8931 57.4017L62.05 32.4531C62.4789 31.8812 62.3359 30.9519 61.764 30.5229C61.1207 30.094 60.2629 30.237 59.834 30.8804L42.6064 54.6137L34.6718 46.6073C34.6718 46.6073 34.0284 46.2499 33.671 46.2499V46.1784Z" fill="#D2A047" />
                <path d="M59.0453 89.0001C56.6864 89.0001 54.3274 87.7133 52.04 86.4981C50.1099 85.4258 48.0369 84.3535 46.4643 84.3535C44.8916 84.3535 42.8901 85.4258 40.8885 86.4981C38.0292 88.0708 35.0269 89.6434 32.0961 88.7141C29.0223 87.7133 27.5211 84.5679 26.0915 81.5655C25.1622 79.6354 24.2329 77.6338 23.0177 76.776C21.8025 75.9181 19.5865 75.6322 17.442 75.2748C14.1537 74.8459 10.7225 74.3455 8.86395 71.8435C7.00538 69.3414 7.64873 65.9101 8.2206 62.6933C8.57802 60.5487 9.00692 58.3326 8.57802 56.8314C8.14912 55.4732 6.57648 53.972 5.00384 52.5422C2.64489 50.3262 0 47.8242 0 44.5358C0 41.2475 2.64489 38.7455 5.00384 36.5294C6.57648 35.0997 8.14912 33.527 8.57802 32.2402C9.0784 30.8105 8.57802 28.523 8.2206 26.3784C7.64873 23.09 7.00538 19.7302 8.86395 17.2282C10.7225 14.6547 14.1537 14.2258 17.442 13.7969C19.5865 13.5109 21.8025 13.225 23.0177 12.2957C24.2329 11.4378 25.1622 9.43622 26.0915 7.5061C27.5211 4.50369 29.0223 1.35831 32.0961 0.357507C35.0269 -0.571811 38.0292 1.00088 40.8885 2.57357C42.8186 3.64586 44.8916 4.71815 46.4643 4.71815C48.0369 4.71815 50.0384 3.64586 52.04 2.57357C54.8993 1.00088 57.9016 -0.571811 60.8324 0.357507C63.9062 1.35831 65.4074 4.50369 66.837 7.5061C67.7663 9.43622 68.6956 11.4378 69.9108 12.2957C71.1261 13.1535 73.342 13.4394 75.4865 13.7969C78.7748 14.2258 82.206 14.7262 84.0646 17.2282C85.9231 19.7302 85.2798 23.1615 84.7079 26.3784C84.3505 28.523 83.9216 30.739 84.3505 32.2402C84.7794 33.5985 86.352 35.0997 87.9247 36.5294C90.2836 38.7455 92.9285 41.2475 92.9285 44.5358C92.9285 47.8242 90.2836 50.3262 87.9247 52.5422C86.352 53.972 84.7794 55.5447 84.3505 56.8314C83.8501 58.2611 84.3505 60.4772 84.7079 62.6933C85.2798 65.9816 85.9231 69.3414 84.0646 71.8435C82.206 74.4169 78.7748 74.8459 75.4865 75.2748C73.342 75.5607 71.1261 75.8467 69.9108 76.7045C68.6956 77.5623 67.7663 79.5639 66.837 81.494C65.4074 84.4965 63.9062 87.6418 60.8324 88.6426C60.2606 88.8571 59.6172 88.9286 58.9739 88.9286L59.0453 89.0001ZM46.4643 80.7792C48.9662 80.7792 51.3966 82.0659 53.7556 83.3527C55.9716 84.5679 58.259 85.7832 59.7602 85.2828C61.3328 84.7824 62.4766 82.3519 63.6203 79.9928C64.764 77.6338 65.9078 75.2033 67.8378 73.8451C69.7679 72.4153 72.4842 72.0579 75.0576 71.7005C77.6311 71.343 80.2759 70.9856 81.2052 69.6989C82.1345 68.4121 81.7056 65.7672 81.2052 63.2651C80.7048 60.6916 80.2759 57.9752 80.9908 55.6876C81.7056 53.4716 83.6357 51.6129 85.4942 49.8973C87.4243 48.1101 89.3543 46.18 89.3543 44.4643C89.3543 42.7487 87.3528 40.89 85.4942 39.0314C83.6357 37.2443 81.7056 35.4571 80.9908 33.241C80.2759 30.9535 80.7048 28.237 81.2052 25.6635C81.6341 23.1615 82.1345 20.5165 81.2052 19.2298C80.2759 17.943 77.6311 17.5856 75.0576 17.2282C72.4842 16.8708 69.7679 16.5133 67.8378 15.0836C65.9078 13.7254 64.764 11.2949 63.6203 8.93582C62.4766 6.57678 61.3328 4.14626 59.7602 3.64586C58.259 3.14546 55.9716 4.43221 53.7556 5.57598C51.3966 6.86273 48.9662 8.14947 46.4643 8.14947C43.9623 8.14947 41.5319 6.86273 39.1729 5.57598C36.957 4.36072 34.598 3.14546 33.1683 3.64586C31.5957 4.14626 30.452 6.57678 29.3082 8.93582C28.1645 11.2949 27.0208 13.7254 25.0907 15.0836C23.1606 16.5133 20.4443 16.8708 17.8709 17.2282C15.2975 17.5856 12.6526 17.943 11.7233 19.2298C10.794 20.5165 11.2229 23.1615 11.7233 25.6635C12.2237 28.237 12.6526 30.9535 11.9377 33.241C11.2229 35.4571 9.29285 37.2443 7.43428 39.0314C5.50423 40.8186 3.57417 42.7487 3.57417 44.4643C3.57417 46.18 5.57571 48.0386 7.43428 49.8973C9.29285 51.6844 11.2229 53.4716 11.9377 55.6876C12.6526 57.9752 12.2237 60.6916 11.7233 63.2651C11.2944 65.7672 10.794 68.4121 11.7233 69.6989C12.6526 71.0571 15.2975 71.343 17.8709 71.7005C20.4443 72.0579 23.1606 72.4153 25.0907 73.8451C27.0208 75.2033 28.1645 77.6338 29.3082 79.9928C30.452 82.3519 31.5957 84.7824 33.1683 85.2828C34.6695 85.7832 36.957 84.4965 39.1729 83.3527C41.5319 82.0659 43.9623 80.7792 46.4643 80.7792Z" fill="#D2A047" />
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

function Parceiros(): ReactNode {
  const logos = [
    { src: "/divify.svg", alt: "Divify", className: "h-12 w-auto max-w-[11.4rem] object-contain sm:h-[3.3rem]" },
    { src: "/advogados.svg", alt: "Wilson & Pinheiro Advogados", className: "h-[4.2rem] w-auto max-w-[11.4rem] object-contain sm:h-[4.8rem]" },
    { src: "/swiss.svg", alt: "Swiss Capital", className: "h-[4.8rem] w-auto max-w-[8.4rem] object-contain sm:h-[5.4rem]" },
    { src: "/starkbank.svg", alt: "Stark Bank", className: "h-9 w-auto max-w-[10.5rem] object-contain sm:h-10" },
  ];

  return (
    <section className="bg-[#D9B366] py-10 lg:py-12" data-analytics-section="parceiros">
      <div className="lp-container flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <AnimateIn className="max-w-md shrink-0 text-center lg:text-left">
          <h2 className="max-w-md text-2xl font-extrabold leading-tight tracking-tight text-[#6C4C14] uppercase sm:text-3xl lg:text-[1.95rem]">
            Quem constrói
            <br />
            com a Atlas Hub
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#6C4C14]/90 sm:text-[0.9375rem]">
            Uma rede de parceiros que compartilha
            <br />
            conhecimento, experiência e oportunidades.
          </p>
        </AnimateIn>
        <AnimateIn delay={80} className="flex flex-wrap items-center justify-center gap-8 sm:gap-10 lg:justify-start">
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

function CtaFinal(): ReactNode {
  return (
    <section className="bg-white pb-0 pt-0" data-analytics-section="cta-final">
      <div className="relative min-h-[24rem] overflow-hidden bg-[#121A3E] sm:min-h-[26.4rem] lg:min-h-[29rem]">
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
        <div className="lp-container relative z-10 flex min-h-[24rem] items-center py-[3.6rem] sm:min-h-[26.4rem] lg:min-h-[29rem] lg:py-[4.2rem]">
          <AnimateIn className="max-w-md">
            <h2 className="text-4xl font-extrabold uppercase leading-tight tracking-tight text-[#D2A047] sm:text-5xl lg:text-[3rem]">
              Pronto para começar?
            </h2>
            <p className="mt-4 max-w-md text-lg font-medium leading-relaxed text-white sm:text-xl">
              Crie sua conta e invista no seu primeiro projeto
              <br />
              em poucos minutos.
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
      <ProjetosAtlas />
      <Curadoria />
      <CvmBanner />
      <Parceiros />
      <CentralDuvidas />
      <CtaFinal />
    </MarketingShell>
  );
}
