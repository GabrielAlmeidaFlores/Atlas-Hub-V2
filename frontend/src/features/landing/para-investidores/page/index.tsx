import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  CheckCircle, ChevronLeft, ChevronRight, ShieldCheck, Wallet,
  RefreshCw, LineChart, Building2, Coins,
} from "lucide-react";
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
            <AnimateIn key={n} delay={i * 70} className="relative pt-6 pb-5">
              <div className="relative flex min-h-[11.5rem] flex-col items-center justify-center rounded-[14px] border-2 border-[#1C2E5E] bg-white px-4 pb-9 pt-7 text-center sm:min-h-[12.5rem]">
                <span
                  className="absolute -top-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-[#1C2E5E] text-base font-bold text-white"
                  aria-hidden
                >
                  {n}
                </span>
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
      <InvestidoresHero />
      <InvestirPassos />

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
