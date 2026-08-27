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

function HeroVisual(): ReactNode {
  return (
    <div className="lp-panel relative overflow-hidden p-5 sm:p-6" style={{ animation: "lp-fade-in-up 0.4s 0.2s ease-out both" }}>
      <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <img src="/atlas-icon.png" alt="" className="h-8 w-8 object-contain" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Operação Atlas</p>
            <p className="text-sm font-semibold text-white">Curadoria em tempo real</p>
          </div>
        </div>
        <span className="rounded-[8px] border border-gold/35 bg-gold/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-gold">
          CVM 88
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ["Originação", "Portal", "navy"],
            ["Análise", "Scorecard", "gold"],
            ["Oferta", "Investidor", "navy"],
          ] as [string, string, string][]
        ).map(([label, value, tone]) => (
          <div key={label} className="rounded-[8px] border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/35">{label}</p>
            <p className={cn("mt-2 text-sm font-bold", tone === "gold" ? "text-gold" : "text-white")}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {[
          { label: "Documentação", pct: 92 },
          { label: "Viabilidade", pct: 86 },
          { label: "Compliance", pct: 100 },
        ].map(({ label, pct }) => (
          <div key={label}>
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className="text-white/45">{label}</span>
              <span className="text-white/70">{pct}%</span>
            </div>
            <div className="h-1 bg-white/10">
              <div className="h-full bg-gold" style={{ width: `${String(pct)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
        <div className="border border-white/10 bg-navy/40 p-3 rounded-[8px]">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/35">Limite por oferta</p>
          <p className="mt-1 text-lg font-extrabold text-white">R$ 15M</p>
        </div>
        <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/35">Taxa plataforma</p>
          <p className="mt-1 text-lg font-extrabold text-gold">10%</p>
        </div>
      </div>
    </div>
  );
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

function TrustBar(): ReactNode {
  const items = [
    { icon: Scale, title: "CVM Resolução 88", desc: "Operação regulada" },
    { icon: ShieldCheck, title: "Patrimônio de afetação", desc: "Checklist de aprovação" },
    { icon: Lock, title: "Conta escrow", desc: "Aportes protegidos" },
    { icon: BadgeCheck, title: "Scorecard 5 critérios", desc: "Análise estruturada" },
  ];

  return (
    <section className="lp-trust-strip">
      <div className="lp-container grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, desc }, i) => (
          <AnimateIn
            key={title}
            delay={i * 60}
            className="flex items-start gap-3 border-b border-border px-1 py-7 sm:border-b-0 sm:px-5 lg:border-r lg:last:border-r-0"
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-navy" />
            <div>
              <p className="text-sm font-bold tracking-tight text-foreground">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
            </div>
          </AnimateIn>
        ))}
      </div>
    </section>
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

function Incorporadoras(): ReactNode {
  const diffs = [
    { icon: Banknote, title: "Sem juros bancários", desc: "Custo previsível: 10% sobre o captado, sem cartório e sem dependência de banco." },
    { icon: Clock, title: "Capital na obra", desc: "Acesso a investidores enquanto o empreendimento está em construção." },
    { icon: Lock, title: "Compliance CVM", desc: "Patrimônio de afetação, SPE/SCP e seguro de obra validados na curadoria." },
  ];

  return (
    <section id="incorporadoras" className="py-16 lg:py-20" data-analytics-section="incorporadoras">
      <div className="lp-container">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <AnimateIn className="lg:col-span-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gold">Incorporadoras</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Financiamento além do banco
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Submeta projetos no portal, receba feedback da curadoria e publique ofertas com investidores reais na plataforma Atlas Hub.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/cadastro" className="btn btn-navy btn-lp inline-flex items-center gap-2">
                Começar pelo rascunho <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/para-incorporadoras" className="btn btn-outline btn-lp inline-flex items-center gap-2">
                Como funciona para você
              </Link>
              <WhatsappLink variant="outline">Falar com suporte</WhatsappLink>
            </div>
          </AnimateIn>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-1 xl:grid-cols-1">
            {diffs.map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 80} className="lp-feature-card flex gap-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-border bg-muted">
                  <Icon className="h-5 w-5 text-navy" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Investidores(): ReactNode {
  const items = [
    {
      image: "/lp/invest-ofertas.jpg",
      title: "Curadoria de alto nível",
      desc: "Adotamos um modelo de seleção estrito para compor nosso portfólio. Cada tese de investimento passa por auditorias financeiras e análises de mercado detalhadas pela equipe da Atlas. O resultado é uma vitrine composta exclusivamente por projetos sólidos e com alto potencial de performance.",
    },
    {
      image: "/lp/invest-escrow.jpg",
      title: "Onboarding e verificação",
      desc: "Priorizamos a conformidade regulatória em cada etapa da sua jornada. A liquidação dos investimentos ocorre via conta escrow para garantir a segregação patrimonial, perfeitamente integrada a um fluxo de cadastro fluido com tecnologia de verificação de identidade, criando um ambiente confiável para todos.",
    },
    {
      image: "/lp/invest-carteira.jpg",
      title: "Gestão de ativos digitais",
      desc: "A infraestrutura de tokenização proporciona uma base tecnológica robusta para a gestão das suas participações. Monitore a evolução da sua carteira de ponta a ponta e receba a distribuição de retornos de forma direta, com registros imutáveis e liquidação automatizada.",
    },
  ];

  return (
    <section id="investidores" className="lp-section-alt py-16 lg:py-20" data-analytics-section="investidores">
      <div className="lp-container">
        <AnimateIn className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gold">Investidores</p>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Investimento com curadoria</h2>
          <p className="mx-auto mt-5 text-base leading-relaxed text-muted-foreground">
            Você investe na plataforma Atlas Hub. A incorporadora originou o projeto; a curadoria filtrou o risco; o escrow e os triggers CVM protegem a operação.
          </p>
        </AnimateIn>

        <div className="grid gap-5 md:grid-cols-3">
          {items.map(({ image, title, desc }, i) => (
            <AnimateIn key={title} delay={i * 70} className="lp-feature-card-gold overflow-hidden p-0">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
              </div>
              <div className="p-7 text-center">
                <h3 className="text-sm font-bold uppercase tracking-widest text-navy">{title}</h3>
                <p className="mt-3 text-xs leading-relaxed text-justify text-muted-foreground">{desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>

        <AnimateIn delay={180} className="mt-12 text-center">
          <Link to="/para-investidores" className="btn btn-navy btn-lp inline-flex items-center gap-2">
            Entender a jornada do investidor <ArrowRight className="h-4 w-4" />
          </Link>
        </AnimateIn>
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

function Compliance(): ReactNode {
  const items = [
    { title: "Patrimônio de afetação", desc: "Validado no checklist pré-aprovação da curadoria." },
    { title: "SPE / SCP", desc: "Estrutura societária revisada antes da oferta." },
    { title: "Seguro de obra", desc: "Requisito de compliance para ir ao ar." },
    { title: "Triggers CVM", desc: "Regras de proteção na jornada do investidor." },
  ];

  return (
    <section className="py-16 lg:py-20">
      <div className="lp-container">
        <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-16">
          <AnimateIn className="lg:col-span-5">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-gold">Confiança</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Governança e compliance embutidos
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Aprovação de oferta exige checklist completo. A operação foi desenhada para transmitir precisão e segurança a incorporadoras e investidores.
            </p>
          </AnimateIn>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {items.map(({ title, desc }, i) => (
              <AnimateIn key={title} delay={i * 60} className="lp-card flex gap-3 p-6">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-navy" />
                <div>
                  <h3 className="text-sm font-medium tracking-tight text-foreground">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ(): ReactNode {
  const [open, setOpen] = useState<number | null>(0);
  const items = [
    {
      q: "Qual a diferença entre o portal e a plataforma de investimento?",
      a: "O portal (este site) é onde a incorporadora cadastra e submete projetos e onde a curadoria Atlas analisa. A plataforma de investimento Atlas Hub é onde o investidor faz KYC, vê ofertas, aporta via PIX e acompanha a carteira — com escrow e regras CVM.",
    },
    { q: "Quem pode captar via Atlas Hub?", a: "Incorporadoras com receita bruta anual de até R$40 milhões (CVM 88), sujeitas à curadoria interna." },
    { q: "Preciso submeter o projeto na hora?", a: "Não. Você cria a conta, salva o rascunho no wizard e só submete quando a documentação estiver pronta." },
    { q: "Qual a taxa da plataforma?", a: "10% sobre o valor captado, cobrado progressivamente — configurado no spread da oferta." },
    {
      q: "Como o investidor coloca dinheiro?",
      a: "Após a oferta publicada, o investidor se cadastra na plataforma Atlas Hub, conclui o KYC e investe via PIX na conta escrow da oferta. Cotas são tokenizadas conforme os parâmetros da oferta.",
    },
    {
      q: "Como falo com o time?",
      a: hasWhatsappSupport()
        ? "Use o WhatsApp de suporte na página ou envie e-mail para contato@atlashub.com.br."
        : "Envie e-mail para contato@atlashub.com.br. Em breve também teremos WhatsApp de suporte.",
    },
  ];

  return (
    <section id="faq" className="lp-section-alt py-16 lg:py-20">
      <div className="lp-container max-w-3xl">
        <AnimateIn className="mb-8 text-center">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gold">FAQ</p>
          <h2 className="text-3xl font-extrabold tracking-tight">Perguntas frequentes</h2>
        </AnimateIn>
        <div className="flex flex-col gap-3">
          {items.map(({ q, a }, i) => (
            <div
              key={q}
              className="overflow-hidden rounded-[8px] border border-border bg-card shadow-[0_1px_2px_rgb(27_43_94/0.04)]"
            >
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors duration-300 hover:bg-muted/60"
                aria-expanded={open === i}
              >
                <span className="text-sm font-bold uppercase tracking-wider text-foreground">{q}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
                    open === i && "rotate-180",
                  )}
                />
              </button>
              {open === i && (
                <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaFinal(): ReactNode {
  return (
    <section className="relative overflow-hidden lp-hero-bg py-16 lg:py-20" data-analytics-section="cta-final">
      <div className="lp-hero-grid pointer-events-none absolute inset-0" />
      <div
        className="lp-float pointer-events-none absolute -right-24 top-10 h-[420px] w-[420px] opacity-70"
        style={{ background: "radial-gradient(circle, rgb(196 144 32 / 0.16) 0%, transparent 70%)" }}
      />
      <AnimateIn className="lp-container relative">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="text-center lg:col-span-6 lg:text-left xl:col-span-7">
            <h2 className="lp-hero-title text-3xl font-extrabold tracking-tight md:text-4xl">
              Pronto para começar?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/55 lg:mx-0">
              Incorporadoras: crie a conta e inicie o wizard. Investidores: fale com o time para conhecer as ofertas na plataforma Atlas Hub.
            </p>
            <div className="mt-10 flex flex-col items-center gap-6 lg:items-start">
              <div className="flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-3 sm:flex-row">
                  <Link to="/cadastro" data-analytics-cta="final_cadastro" className="btn btn-gold btn-lp inline-flex items-center justify-center gap-2">
                    Criar conta incorporadora <ArrowRight className="h-4 w-4" />
                  </Link>
                  <WhatsappLink variant="hero">Falar no WhatsApp</WhatsappLink>
                </div>
                <p className="text-center text-sm font-medium text-white">
                  <Link to="/login" className="transition-opacity duration-300 hover:opacity-80 hover:underline">
                    Já tenho conta
                  </Link>
                  {" - "}
                  <Link to="/para-investidores" className="transition-opacity duration-300 hover:opacity-80 hover:underline">
                    Sou Investidor
                  </Link>
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 xl:col-span-5">
            <HeroVisual />
          </div>
        </div>
      </AnimateIn>
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
      <Incorporadoras />
      <Investidores />
      <Numeros />
      <Compliance />
      <CtaFinal />
      <FAQ />
    </MarketingShell>
  );
}
