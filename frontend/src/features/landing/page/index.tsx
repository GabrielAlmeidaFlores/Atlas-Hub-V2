import { type ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight, ShieldCheck, CheckCircle, ChevronDown,
  TrendingUp, Banknote, FileCheck, Clock,
  Building2, Users, Star, BarChart3, Lock,
} from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { WhatsappLink } from "@/components/shared/whatsapp-cta";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { hasWhatsappSupport } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

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
    <section className="relative overflow-hidden lp-hero-bg pb-20 pt-16">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #C49020 1px, transparent 0)", backgroundSize: "28px 28px" }}
      />
      <div className="lp-float pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px]" style={{ background: "radial-gradient(circle, rgb(196 144 32 / 0.18) 0%, transparent 70%)" }} />

      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 border border-gold/30 bg-gold/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gold" style={{ animation: "lp-fade-in 0.5s ease-out both" }}>
          <ShieldCheck className="h-3.5 w-3.5" />
          Crowdfunding · CVM Resolução 88
        </div>
        <h1 className="lp-hero-title mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl" style={{ animation: "lp-fade-in-up 0.7s 0.1s ease-out both" }}>
          Construa sem banco.
          <br />
          Capte com investidores.
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/55 md:text-xl" style={{ animation: "lp-fade-in-up 0.7s 0.2s ease-out both" }}>
          Atlas Hub conecta incorporadoras e investidores: você submete o projeto, nossa curadoria valida, e a oferta sobe na plataforma de investimento Atlas Hub — com KYC, escrow e regras CVM.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animation: "lp-fade-in-up 0.7s 0.32s ease-out both" }}>
          <Link to="/cadastro" className="btn btn-gold btn-lp inline-flex items-center justify-center gap-2 text-sm font-bold">
            Cadastrar incorporadora <ArrowRight className="h-4 w-4" />
          </Link>
          <WhatsappLink variant="hero">Falar com suporte</WhatsappLink>
        </div>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-white/40" style={{ animation: "lp-fade-in-up 0.7s 0.4s ease-out both" }}>
          <a href="#como-funciona" className="underline-offset-4 hover:text-white/70 hover:underline">Ver como funciona</a>
          {" · "}
          <Link to="/para-incorporadoras" className="underline-offset-4 hover:text-white/70 hover:underline">Guia incorporadoras</Link>
          {" · "}
          <Link to="/para-investidores" className="underline-offset-4 hover:text-white/70 hover:underline">Guia investidores</Link>
        </p>

        <div className="mt-16 flex flex-wrap justify-center gap-10 border-t border-white/10 pt-10 text-sm text-white/45" style={{ animation: "lp-fade-in-up 0.7s 0.5s ease-out both" }}>
          {(
            [
              ["CVM 88", "Regulação"],
              ["Sem banco", "Capital via oferta"],
              ["Humana", "Curadoria Atlas"],
            ] as [string, string][]
          ).map(([num, label]) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-extrabold text-gold">{num}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Ecossistema(): ReactNode {
  return (
    <section className="border-b border-border py-20">
      <div className="mx-auto max-w-6xl px-6">
        <AnimateIn className="mb-12 text-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-navy">Ecossistema</p>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Como o Atlas Hub funciona de ponta a ponta</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Há dois mundos sob a mesma marca: o portal onde a incorporadora originadora trabalha, e a plataforma onde o investidor aplica dinheiro com proteção CVM.
          </p>
        </AnimateIn>
        <div className="grid gap-4 lg:grid-cols-3">
          <AnimateIn className="border border-border bg-card p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gold">1 · Incorporadora</p>
            <h3 className="mt-3 text-sm font-bold uppercase tracking-wider">Portal de originação</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Cadastro, wizard de projeto (dados, financeiro, docs, equipe), rascunhos e acompanhamento de status. É aqui que o empreendimento nasce no Atlas.
            </p>
            <Link to="/para-incorporadoras" className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-navy hover:underline">
              Detalhes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </AnimateIn>
          <AnimateIn delay={90} className="border border-border bg-card p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy">2 · Curadoria Atlas</p>
            <h3 className="mt-3 text-sm font-bold uppercase tracking-wider">Análise humana</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Scorecard em 5 critérios, pedido de ajuste, reprovação ou aprovação. Checklist CVM (afetação, seguro, SPE/SCP) antes da oferta ir ao ar.
            </p>
          </AnimateIn>
          <AnimateIn delay={180} className="border border-border bg-card p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gold">3 · Investidor</p>
            <h3 className="mt-3 text-sm font-bold uppercase tracking-wider">Plataforma de investimento</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Vitrine, KYC, PIX, escrow, cotas tokenizadas, carteira e triggers CVM. O investidor só vê Atlas Hub — não usa o portal da incorporadora.
            </p>
            <Link to="/para-investidores" className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-navy hover:underline">
              Detalhes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}

function ComoFunciona(): ReactNode {
  const steps = [
    { icon: Building2, title: "Cadastro", desc: "Incorporadora cria conta, confirma e-mail e completa o perfil da empresa." },
    { icon: FileCheck, title: "Projeto", desc: "Wizard em 5 etapas com documentos, financeiro, viabilidade e equipe." },
    { icon: BarChart3, title: "Curadoria", desc: "Analistas pontuam e decidem: ajuste, reprova ou aprova." },
    { icon: TrendingUp, title: "Oferta no ar", desc: "Oferta publicada na plataforma de investimento; investidores aportam via PIX." },
  ];

  return (
    <section id="como-funciona" className="lp-steps-section py-24">
      <div className="mx-auto max-w-6xl px-6">
        <AnimateIn className="mb-14 text-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-navy">Fluxo</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Do projeto ao capital</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Quatro etapas simples — do rascunho no portal até o investidor na plataforma Atlas.</p>
        </AnimateIn>
        <div className="grid gap-0 border border-border md:grid-cols-4">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <AnimateIn key={title} delay={i * 90} className="border-b border-r border-border bg-card p-6 last:border-r-0 md:border-b-0">
              <div className="lp-step-number mb-4">{i + 1}</div>
              <Icon className="mb-3 h-5 w-5 text-navy" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </AnimateIn>
          ))}
        </div>
        <AnimateIn delay={320} className="mt-12 flex flex-col items-center justify-center gap-3 border border-border bg-card px-6 py-8 text-center sm:flex-row">
          <div className="sm:mr-4 sm:text-left">
            <p className="text-sm font-bold uppercase tracking-wider text-foreground">Quer o detalhe completo?</p>
            <p className="mt-1 text-xs text-muted-foreground">Guias separados para cada público.</p>
          </div>
          <Link to="/para-incorporadoras" className="btn btn-navy btn-lp inline-flex items-center gap-2">
            Incorporadoras <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/para-investidores" className="btn btn-outline btn-lp inline-flex items-center gap-2">
            Investidores
          </Link>
        </AnimateIn>
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
    <section id="incorporadoras" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <AnimateIn className="mb-14 max-w-2xl">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gold">Incorporadoras</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Financiamento além do banco</h2>
          <p className="mt-3 text-muted-foreground">
            Submeta projetos no portal, receba feedback da curadoria e publique ofertas com investidores reais na plataforma Atlas Hub.
          </p>
        </AnimateIn>
        <div className="grid gap-4 md:grid-cols-3">
          {diffs.map(({ icon: Icon, title, desc }, i) => (
            <AnimateIn key={title} delay={i * 100} className="lp-feature-card">
              <Icon className="mb-4 h-5 w-5 text-navy" />
              <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </AnimateIn>
          ))}
        </div>
        <AnimateIn delay={280} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link to="/cadastro" className="btn btn-navy btn-lp inline-flex items-center gap-2">
            Começar pelo rascunho <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/para-incorporadoras" className="btn btn-outline btn-lp inline-flex items-center gap-2">
            Como funciona para você
          </Link>
          <WhatsappLink variant="outline">Falar com suporte</WhatsappLink>
        </AnimateIn>
      </div>
    </section>
  );
}

function Investidores(): ReactNode {
  const items = [
    { icon: Users, title: "Ofertas curadas", desc: "Só projetos aprovados pela equipe Atlas entram na vitrine." },
    { icon: ShieldCheck, title: "Escrow e KYC", desc: "Aporte via PIX em conta escrow; cadastro PF/PJ com verificação." },
    { icon: Star, title: "Carteira e retorno", desc: "Cotas tokenizadas, acompanhamento e distribuição conforme o modelo da oferta." },
  ];

  return (
    <section id="investidores" className="lp-section-alt py-16">
      <div className="mx-auto max-w-6xl px-6">
        <AnimateIn className="mb-8 text-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-navy">Investidores</p>
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Investimento com curadoria</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Você investe na plataforma Atlas Hub. A incorporadora originou o projeto; a curadoria filtrou o risco; o escrow e os triggers CVM protegem a operação.
          </p>
        </AnimateIn>
        <div className="grid gap-3 md:grid-cols-3">
          {items.map(({ icon: Icon, title, desc }, i) => (
            <AnimateIn key={title} delay={i * 80} className="lp-feature-card-gold p-5">
              <Icon className="mb-3 h-4 w-4 text-gold" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </AnimateIn>
          ))}
        </div>
        <AnimateIn delay={200} className="mt-8 text-center">
          <Link to="/para-investidores" className="btn btn-navy btn-lp inline-flex items-center gap-2">
            Entender a jornada do investidor <ArrowRight className="h-4 w-4" />
          </Link>
        </AnimateIn>
      </div>
    </section>
  );
}

function Numeros(): ReactNode {
  return (
    <section className="border-y border-border bg-navy py-14 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
        {(
          [
            ["CVM 88", "Regulação"],
            ["10%", "Taxa sobre o captado"],
            ["R$15M", "Limite por oferta"],
            ["5 critérios", "Scorecard"],
          ] as [string, string][]
        ).map(([v, l], i) => (
          <AnimateIn key={l} delay={i * 80} className="text-center">
            <div className="text-2xl font-extrabold text-gold md:text-3xl">{v}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/50">{l}</div>
          </AnimateIn>
        ))}
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
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <AnimateIn className="mb-10 text-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-navy">FAQ</p>
          <h2 className="text-3xl font-extrabold tracking-tight">Perguntas frequentes</h2>
        </AnimateIn>
        <div className="border border-border">
          {items.map(({ q, a }, i) => (
            <div key={q} className="border-b border-border last:border-b-0">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-bold uppercase tracking-wider text-foreground">{q}</span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open === i && "rotate-180")} />
              </button>
              {open === i && <p className="px-5 pb-4 text-xs leading-relaxed text-muted-foreground">{a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaFinal(): ReactNode {
  return (
    <section className="lp-section-alt py-24">
      <AnimateIn className="mx-auto max-w-6xl border border-border bg-card px-6 py-14 text-center sm:px-12">
        <CheckCircle className="mx-auto mb-4 h-8 w-8 text-navy" />
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Pronto para começar?</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Incorporadoras: crie a conta e inicie o wizard. Investidores: fale com o time para conhecer as ofertas na plataforma Atlas Hub.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/cadastro" className="btn btn-navy btn-lp inline-flex items-center justify-center gap-2">Criar conta incorporadora <ArrowRight className="h-4 w-4" /></Link>
          <WhatsappLink variant="outline">Falar no WhatsApp</WhatsappLink>
        </div>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <Link to="/login" className="hover:text-foreground hover:underline">Já tenho conta — entrar</Link>
          {" · "}
          <Link to="/para-investidores" className="hover:text-foreground hover:underline">Sou investidor</Link>
        </p>
      </AnimateIn>
    </section>
  );
}

export default function LandingPage(): ReactNode {
  return (
    <MarketingShell>
      <ScrollToHash />
      <Hero />
      <Ecossistema />
      <ComoFunciona />
      <Incorporadoras />
      <Investidores />
      <Numeros />
      <FAQ />
      <CtaFinal />
    </MarketingShell>
  );
}
