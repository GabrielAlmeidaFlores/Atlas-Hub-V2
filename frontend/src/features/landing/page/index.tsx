import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ShieldCheck, CheckCircle, ChevronDown,
  Menu, X, TrendingUp, Banknote, FileCheck, Clock,
  Building2, Users, Star, BarChart3, Lock,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { AnimateIn } from "@/components/animate-in";
import { cn } from "@/lib/utils";

function Navbar(): ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-white/10 bg-navy-dark/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <Logo size="md" scheme="dark" />
        <nav className="hidden items-center gap-8 md:flex">
          {[
            ["Para Incorporadoras", "#incorporadoras"],
            ["Para Investidores", "#investidores"],
            ["Como Funciona", "#como-funciona"],
          ].map(([label, href]) => (
            <a key={label} href={href} className="text-[11px] font-bold uppercase tracking-wider text-white/65 transition-colors hover:text-white">
              {label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="text-[11px] font-bold uppercase tracking-wider text-white/70 hover:text-white">Entrar</Link>
          <Link to="/cadastro" className="btn btn-gold btn-lp text-[11px] uppercase tracking-wider">Cadastrar</Link>
        </div>
        <button type="button" onClick={() => setOpen((p) => !p)} className="border border-white/20 p-1.5 text-white md:hidden" aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-white/10 bg-navy-dark px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {[
              ["Para Incorporadoras", "#incorporadoras"],
              ["Para Investidores", "#investidores"],
              ["Como Funciona", "#como-funciona"],
            ].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setOpen(false)} className="px-2 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/70 hover:text-white">
                {label}
              </a>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
            <Link to="/login" onClick={() => setOpen(false)} className="btn btn-outline w-full justify-center border-white/20 text-white">Entrar</Link>
            <Link to="/cadastro" onClick={() => setOpen(false)} className="btn btn-gold w-full justify-center">Cadastrar incorporadora</Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero(): ReactNode {
  return (
    <section className="relative overflow-hidden lp-hero-bg pb-20 pt-16">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #C49020 1px, transparent 0)", backgroundSize: "28px 28px" }}
      />
      <div className="lp-float pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px]  " style={{ background: "radial-gradient(circle, rgb(196 144 32 / 0.18) 0%, transparent 70%)" }} />

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
          Atlas Hub origina e faz a curadoria de projetos imobiliários. Após aprovação, a oferta vai ao ar para investidores — com infraestrutura regulatória completa.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row" style={{ animation: "lp-fade-in-up 0.7s 0.32s ease-out both" }}>
          <Link to="/cadastro" className="btn btn-gold btn-lp inline-flex items-center justify-center gap-2 text-sm font-bold">
            Cadastrar incorporadora <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#como-funciona" className="btn btn-lp inline-flex items-center justify-center gap-2 border-2 border-white/25 bg-transparent text-sm font-bold text-white hover:bg-white/5">
            Como funciona
          </a>
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-10 border-t border-white/10 pt-10 text-sm text-white/45" style={{ animation: "lp-fade-in-up 0.7s 0.5s ease-out both" }}>
          {(
            [
              ["10%", "Taxa sobre o captado"],
              ["R$15M", "Limite CVM por oferta"],
              ["100%", "Curadoria humana"],
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

function ComoFunciona(): ReactNode {
  const steps = [
    { icon: Building2, title: "Cadastre-se", desc: "Crie a conta da incorporadora e complete o perfil da empresa." },
    { icon: FileCheck, title: "Submeta o projeto", desc: "Wizard em 5 etapas: dados, financeiro, documentos, equipe e revisão." },
    { icon: BarChart3, title: "Curadoria Atlas", desc: "Analistas pontuam scorecard e decidem: ajuste, reprovação ou aprovação." },
    { icon: TrendingUp, title: "Oferta no ar", desc: "Após aprovação, a oferta é publicada na plataforma para investidores." },
  ];

  return (
    <section id="como-funciona" className="lp-steps-section py-24">
      <div className="mx-auto max-w-6xl px-6">
        <AnimateIn className="mb-14 text-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-navy">Fluxo</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Como funciona</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Do cadastro à oferta publicada — um funil claro para incorporadoras.</p>
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
          <p className="mt-3 text-muted-foreground">Submeta projetos, receba feedback da curadoria e publique ofertas com investidores reais.</p>
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
        <AnimateIn delay={280} className="mt-10">
          <Link to="/cadastro" className="btn btn-navy btn-lp inline-flex items-center gap-2">
            Começar agora <ArrowRight className="h-4 w-4" />
          </Link>
        </AnimateIn>
      </div>
    </section>
  );
}

function Investidores(): ReactNode {
  const items = [
    { icon: Users, title: "Ofertas curadas", desc: "Só projetos aprovados pela equipe Atlas entram na vitrine de investimento." },
    { icon: ShieldCheck, title: "Escrow e KYC", desc: "Infraestrutura regulatória, tokenização e compliance embutidos na plataforma." },
    { icon: Star, title: "Retorno imobiliário", desc: "Participação no lucro da venda ou dívida pré-fixada (Modelo 1 — MVP)." },
  ];

  return (
    <section id="investidores" className="lp-section-alt py-24">
      <div className="mx-auto max-w-6xl px-6">
        <AnimateIn className="mb-14 text-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-navy">Investidores</p>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Investimento com curadoria</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">A experiência do investidor é 100% Atlas Hub — o Atlas garante a qualidade da origem e da operação.</p>
        </AnimateIn>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map(({ icon: Icon, title, desc }, i) => (
            <AnimateIn key={title} delay={i * 100} className="lp-feature-card-gold">
              <Icon className="mb-4 h-5 w-5 text-gold" />
              <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function Numeros(): ReactNode {
  return (
    <section className="border-y border-border bg-navy py-16 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
        {(
          [
            ["CVM 88", "Regulação"],
            ["5 etapas", "Wizard de projeto"],
            ["5 critérios", "Scorecard"],
            ["3 perfis", "Acesso controlado"],
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
    { q: "Quem pode captar via Atlas Hub?", a: "Incorporadoras com receita bruta anual de até R$40 milhões (CVM 88), sujeitas à curadoria interna." },
    { q: "Como funciona a parte do investidor?", a: "KYC, escrow, tokenização, vitrine de ofertas e a operação do investidor ficam na plataforma Atlas Hub. O portal de originador e a curadoria são onde as incorporadoras e a equipe Atlas trabalham." },
    { q: "Qual a taxa da plataforma?", a: "10% sobre o valor captado, cobrado progressivamente — configurado no spread da oferta." },
    { q: "Posso resubmeter um projeto reprovado?", a: "Sim. Não há limite de tentativas. O histórico e scorecards anteriores ficam visíveis ao analista." },
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
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Pronto para submeter seu projeto?</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">Cadastre a incorporadora e inicie o wizard de submissão em minutos.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/cadastro" className="btn btn-navy btn-lp inline-flex items-center justify-center gap-2">Criar conta <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/login" className="btn btn-outline btn-lp inline-flex items-center justify-center">Já tenho conta</Link>
        </div>
      </AnimateIn>
    </section>
  );
}

function Footer(): ReactNode {
  return (
    <footer className="border-t border-border bg-navy-dark py-12 text-white/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <Logo size="sm" scheme="dark" />
          <p className="mt-3 max-w-xs text-xs leading-relaxed">Crowdfunding imobiliário regulado pela CVM Resolução 88.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-[10px] font-bold uppercase tracking-widest">
          <div className="space-y-2">
            <p className="text-white/80">Produto</p>
            <a href="#como-funciona" className="block hover:text-white">Como funciona</a>
            <a href="#incorporadoras" className="block hover:text-white">Incorporadoras</a>
            <Link to="/login" className="block hover:text-white">Entrar</Link>
          </div>
          <div className="space-y-2">
            <p className="text-white/80">Contato</p>
            <p>contato@atlashub.com.br</p>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 px-6 pt-6 text-[10px] font-bold uppercase tracking-widest">
        © 2026 Atlas Hub
      </div>
    </footer>
  );
}

export default function LandingPage(): ReactNode {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <ComoFunciona />
      <Incorporadoras />
      <Investidores />
      <Numeros />
      <FAQ />
      <CtaFinal />
      <Footer />
    </div>
  );
}
