import { type ReactNode, useState, useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react";
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
} from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { CountUp } from "@/components/count-up";
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

function Numeros(): ReactNode {
  const sectionRef = useRef<HTMLElement>(null);
  const [glow, setGlow] = useState({ x: 50, y: 50, visible: false });

  const items = [
    { end: 88, prefix: "CVM ", suffix: "", label: "Regulação", duration: 2800 },
    { end: 10, prefix: "", suffix: "%", label: "Taxa sobre o captado", duration: 2400 },
    { end: 15, prefix: "R$", suffix: "M", label: "Limite por oferta", duration: 2600 },
    { end: 5, prefix: "", suffix: " critérios", label: "Scorecard", duration: 2200 },
  ];

  function handleMove(e: ReactMouseEvent<HTMLElement>): void {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setGlow({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      visible: true,
    });
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMove}
      onMouseLeave={() => setGlow((prev) => ({ ...prev, visible: false }))}
      className="relative overflow-hidden bg-navy py-14 text-white lg:py-16"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgb(255 255 255 / 0.04) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: glow.visible ? 1 : 0,
          background: `radial-gradient(420px circle at ${String(glow.x)}% ${String(glow.y)}%, rgb(75 107 218 / 0.28), transparent 55%)`,
        }}
        aria-hidden
      />
      <div className="lp-container relative grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-8">
        {items.map(({ end, prefix, suffix, label, duration }, i) => (
          <AnimateIn key={label} delay={i * 60} className="text-center md:text-left">
            <CountUp
              end={end}
              prefix={prefix}
              suffix={suffix}
              duration={duration}
              className="block text-3xl font-extrabold tracking-tight text-gold md:text-4xl"
            />
            <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/45">{label}</div>
          </AnimateIn>
        ))}
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
      <Numeros />
    </MarketingShell>
  );
}
