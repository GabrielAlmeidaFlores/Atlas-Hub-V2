import { type ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, CheckCircle, ChevronLeft, ChevronRight, ShieldCheck, Wallet,
  RefreshCw, LineChart, Building2, Coins, FileCheck, TrendingUp,
} from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { TypedHeroTitle } from "@/components/typed-hero-title";
import { WhatsappLink } from "@/components/shared/whatsapp-cta";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { useLandingAnalytics } from "@/lib/analytics/use-landing-analytics";

const HERO_TITLE = [
  { text: "Invista em imóveis com ", tone: "base" as const },
  { text: "curadoria Atlas", tone: "gold" as const },
  { text: " e regras CVM", tone: "base" as const },
] as const;

const FLOW = [
  {
    icon: Building2,
    title: "Originação",
    desc: "Projeto entra pelo portal da incorporadora",
  },
  {
    icon: FileCheck,
    title: "Curadoria",
    desc: "Atlas aprova ou pede ajuste",
  },
  {
    icon: TrendingUp,
    title: "Investimento",
    desc: "Você aporta na oferta publicada",
  },
] as const;

const JOURNEY = [
  {
    title: "Escolha uma oferta Atlas",
    desc: "Na vitrine da plataforma de investimento Atlas Hub você vê ofertas públicas (CVM 88) e, quando aplicável, privadas (club deal). Cada card mostra rentabilidade estimada, prazo e progresso de captação.",
  },
  {
    title: "Cadastro e KYC",
    desc: "PF: verificação rápida. PJ: análise em até poucos dias úteis. Sem KYC aprovado, não há aporte.",
  },
  {
    title: "Invista via PIX",
    desc: "O aporte vai para conta escrow da oferta. As cotas são tokenizadas (lote mínimo configurável, tipicamente a partir de R$10 por token).",
  },
  {
    title: "Acompanhe e receba",
    desc: "Carteira, comunicados da oferta, possíveis cessões no mercado secundário e distribuição de retorno conforme o modelo (participação no lucro ou dívida).",
  },
] as const;

const PROTECTIONS = [
  {
    image: "/lp/protecao-escrow.jpg",
    title: "Escrow por oferta",
    desc: "Recursos ficam segregados na conta da oferta até os gatilhos CVM liberarem ou devolverem.",
  },
  {
    image: "/lp/protecao-triggers.jpg",
    title: "Triggers CVM",
    desc: "Atingiu 2/3 da meta no prazo: libera ao emissor. Insucesso: devolução integral aos investidores.",
  },
  {
    image: "/lp/protecao-curadoria.jpg",
    title: "Curadoria prévia",
    desc: "Só entram ofertas de projetos aprovados pela equipe Atlas (documentação, risco e elegibilidade).",
  },
  {
    image: "/lp/protecao-transparencia.jpg",
    title: "Transparência",
    desc: "Página da oferta com materiais, documentos e acompanhamento — tudo sob a marca Atlas Hub.",
  },
] as const;

const FEATURES = [
  { icon: Building2, title: "Vitrine de ofertas", desc: "Descubra empreendimentos curados com dados claros de captação." },
  { icon: Wallet, title: "Carteira", desc: "Veja posições, aportes e status das suas cotas." },
  { icon: Coins, title: "Tokenização", desc: "Participação fracionada com regras definidas por oferta." },
  { icon: RefreshCw, title: "Mercado secundário", desc: "Cessão P2P entre investidores da mesma oferta (quando habilitado)." },
  { icon: LineChart, title: "Acompanhamento", desc: "Comunicados, RI e prestação conforme a operação da oferta." },
  { icon: ShieldCheck, title: "KYC e compliance", desc: "Cadastro PF/PJ alinhado à operação regulada CVM 88." },
] as const;

function FeaturesCarousel(): ReactNode {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (el === null) return;
    const slide = el.querySelector(".lp-features-slide");
    const amount = slide instanceof HTMLElement ? slide.offsetWidth + 12 : 280;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="lp-features-track flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory"
      >
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <article key={title} className="lp-features-slide rounded-[8px] border border-border bg-card p-5">
            <Icon className="mb-3 h-4 w-4 text-gold" />
            <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button type="button" aria-label="Anterior" onClick={() => scrollBy(-1)} className="lp-carousel-nav">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Próximo" onClick={() => scrollBy(1)} className="lp-carousel-nav">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ProtectionsCarousel(): ReactNode {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % PROTECTIONS.length);
    }, 3000);
    return () => {
      window.clearInterval(timer);
    };
  }, [paused]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el === null) return;
    const slide = el.querySelectorAll(".lp-protections-slide")[index];
    if (!(slide instanceof HTMLElement)) return;
    el.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  }, [index]);

  function go(dir: -1 | 1) {
    setIndex((prev) => (prev + dir + PROTECTIONS.length) % PROTECTIONS.length);
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      <div
        ref={scrollerRef}
        className="lp-protections-track flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory"
      >
        {PROTECTIONS.map(({ image, title, desc }) => (
          <article key={title} className="lp-protections-slide lp-feature-card-gold overflow-hidden p-0">
            <div className="aspect-[16/10] overflow-hidden">
              <img src={image} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-navy">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button type="button" aria-label="Anterior" onClick={() => go(-1)} className="lp-carousel-nav">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Próximo" onClick={() => go(1)} className="lp-carousel-nav">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function ParaInvestidoresPage(): ReactNode {
  useLandingAnalytics(true);
  return (
    <MarketingShell>
      <section className="lp-hero-bg relative overflow-hidden pb-16 pt-28" data-analytics-section="hero">
        <div className="relative lp-container">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gold">Para investidores</p>
          <TypedHeroTitle
            segments={HERO_TITLE}
            className="lp-hero-title max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl"
          />
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
            A experiência de investimento é 100% Atlas Hub: vitrine, KYC, PIX, escrow e carteira.
            Por trás, a mesma infraestrutura regulatória usada em operações CVM 88 — você não precisa lidar com o portal da incorporadora.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <WhatsappLink variant="gold">Quero saber das ofertas</WhatsappLink>
            <Link to="/para-incorporadoras" className="btn btn-lp inline-flex items-center justify-center border-2 border-white/20 bg-transparent text-sm font-bold text-white hover:bg-white/5">
              Sou incorporadora
            </Link>
            <Link to="/" className="btn btn-lp inline-flex items-center justify-center gap-2 border-2 border-white/10 bg-transparent text-sm font-bold text-white/80 hover:bg-white/5">
              Voltar ao início <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="lp-steps-section border-b border-border py-16">
        <div className="lp-container">
          <AnimateIn className="mb-10 max-w-3xl">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gold">Como se encaixa</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Incorporadora originadora · você investe</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Incorporadoras submetem projetos no portal Atlas e passam por curadoria humana.
              Só depois a oferta aparece na <strong className="text-foreground">plataforma de investimento Atlas Hub</strong>,
              onde você avalia, investe e acompanha — com escrow, tokenização de cotas e proteção dos gatilhos CVM.
            </p>
          </AnimateIn>
          <div className="grid gap-6 md:grid-cols-3 lg:gap-7">
            {FLOW.map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 80} className="lp-step-card">
                <span className="lp-step-watermark" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="relative">
                  <Icon className="mb-5 h-5 w-5 text-navy" strokeWidth={1.75} />
                  <h3 className="text-base font-bold tracking-tight text-navy">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section-alt py-16">
        <div className="lp-container">
          <AnimateIn className="mb-10">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gold">Jornada</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Do interesse ao retorno</h2>
          </AnimateIn>
          <ol className="space-y-0 overflow-hidden rounded-[8px] border border-border">
            {JOURNEY.map((step, i) => (
              <AnimateIn key={step.title} delay={i * 70} className="flex gap-4 border-b border-border bg-card p-5 last:border-b-0 sm:gap-6">
                <div className="lp-step-number shrink-0">{i + 1}</div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </AnimateIn>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16">
        <div className="lp-container">
          <AnimateIn className="mb-10">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gold">Proteção</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">O que reduz o risco operacional</h2>
          </AnimateIn>
          <ProtectionsCarousel />
          <p className="mt-6 text-xs text-muted-foreground">
            Investimento em crowdfunding imobiliário envolve risco de perda de capital, prazo e liquidez. Leia os documentos da oferta antes de investir.
          </p>
        </div>
      </section>

      <section className="lp-section-alt overflow-x-hidden py-16">
        <div className="lp-container">
          <AnimateIn className="mb-10">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-navy">Plataforma</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">O que a experiência Atlas oferece</h2>
          </AnimateIn>
          <FeaturesCarousel />
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <AnimateIn>
            <CheckCircle className="mx-auto mb-4 h-8 w-8 text-navy" />
            <h2 className="text-2xl font-extrabold tracking-tight">Quer ser avisado das próximas ofertas?</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
              Fale com o time Atlas. Incorporadoras usam o cadastro do portal; investidores operam na plataforma de investimento sob a marca Atlas Hub.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <WhatsappLink variant="navy">Falar no WhatsApp</WhatsappLink>
              <a href="mailto:contato@atlashub.com.br" className="btn btn-outline btn-lp inline-flex items-center justify-center">
                contato@atlashub.com.br
              </a>
            </div>
          </AnimateIn>
        </div>
      </section>
    </MarketingShell>
  );
}
