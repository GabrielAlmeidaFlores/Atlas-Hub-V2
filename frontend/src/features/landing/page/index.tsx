import { type ReactNode, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ShieldCheck, CheckCircle, ChevronDown,
  Menu, X, TrendingUp, Banknote, FileCheck, Clock,
  Building2, Users, Star, BarChart3, Lock,
  MapPin, Phone,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

/* ── Helpers ─────────────────────────────────────────── */
function useScrolled(threshold = 24): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = (): void => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return scrolled;
}

/* ── Navbar ──────────────────────────────────────────── */
function Navbar(): ReactNode {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/98 shadow-[0_1px_0_#E5E7EB] backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Logo size="md" scheme={scrolled ? "light" : "dark"} />

        {/* Desktop links */}
        <nav className="hidden items-center gap-8 lg:flex">
          {[
            ["Para Incorporadoras", "#incorporadoras"],
            ["Para Investidores",   "#investidores"],
            ["Como Funciona",       "#como-funciona"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className={cn(
                "text-sm font-medium transition-colors",
                scrolled ? "text-slate-600 hover:text-navy" : "text-white/80 hover:text-white",
              )}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/login"
            className={cn(
              "text-sm font-semibold transition-colors",
              scrolled ? "text-slate-700 hover:text-navy" : "text-white/80 hover:text-white",
            )}
          >
            Entrar
          </Link>
          <Link to="/cadastro" className="btn btn-navy btn-sm rounded-xl font-semibold">
            Cadastrar incorporadora
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className={cn("lg:hidden", scrolled ? "text-slate-700" : "text-white")}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-slate-100 bg-white px-5 py-4 shadow-lg lg:hidden">
          <div className="flex flex-col gap-1">
            {[
              ["Para Incorporadoras", "#incorporadoras"],
              ["Para Investidores",   "#investidores"],
              ["Como Funciona",       "#como-funciona"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
            <Link to="/login"    onClick={() => setOpen(false)} className="btn btn-outline w-full justify-center">Entrar</Link>
            <Link to="/cadastro" onClick={() => setOpen(false)} className="btn btn-navy w-full justify-center">Cadastrar incorporadora</Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ── Hero ────────────────────────────────────────────── */
function Hero(): ReactNode {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0d1830]">
      {/* Gradient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-40 top-0 h-[300px] w-[300px] sm:h-[600px] sm:w-[600px] rounded-full opacity-30 blur-[120px]"
          style={{ background: "radial-gradient(circle, #1B2B5E 0%, transparent 70%)" }}
        />
        <div
          className="absolute -right-20 top-20 h-[250px] w-[250px] sm:h-[500px] sm:w-[500px] rounded-full opacity-20 blur-[100px]"
          style={{ background: "radial-gradient(circle, #C49020 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-[200px] w-[400px] sm:h-[400px] sm:w-[800px] -translate-x-1/2 rounded-full opacity-10 blur-[100px]"
          style={{ background: "radial-gradient(circle, #4B6BDA 0%, transparent 70%)" }}
        />
      </div>

      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center min-h-screen px-5 pb-24 pt-32 text-center lg:px-8">

        {/* Pill badge */}
        <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-5 py-2 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.5)]" />
          <span className="text-sm font-medium text-white/80">Plataforma regulada pela CVM Resolução 88</span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-5xl text-5xl font-black leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Construa sem banco.{" "}
          <br className="hidden sm:block" />
          <span className="text-gradient-gold">Capte com investidores.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-lg text-white/60 leading-relaxed sm:text-xl">
          A Atlas Hub conecta incorporadoras a investidores em projetos imobiliários curados.
          Sem juros mensais, sem burocracia bancária — apenas 10% sobre o captado.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/cadastro"
            className="group inline-flex items-center gap-2.5 rounded-2xl bg-gold px-8 py-4 text-base font-bold text-white shadow-gold-sm transition-all hover:bg-gold-light hover:shadow-[0_4px_20px_rgb(196,144,32,0.5)] active:scale-[0.98]"
          >
            Cadastrar incorporadora
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-8 py-4 text-base font-medium text-white/80 transition-all hover:border-white/30 hover:bg-white/5"
          >
            Como funciona
            <ChevronDown className="h-4 w-4 opacity-60" />
          </a>
        </div>

        {/* Stats strip */}
        <div className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { value: "10%",   label: "Taxa única" },
            { value: "R$0",   label: "Taxa de cartório" },
            { value: "CVM",   label: "88 Regulado" },
            { value: "100%",  label: "Digital" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/8 bg-white/4 px-4 py-5 backdrop-blur-sm"
            >
              <p className="text-2xl font-black text-gold sm:text-3xl">{value}</p>
              <p className="mt-1 text-xs text-white/50">{label}</p>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <ChevronDown className="h-5 w-5 text-white" />
        </div>
      </div>
    </section>
  );
}

/* ── Logos / Trust ───────────────────────────────────── */
function TrustBar(): ReactNode {
  return (
    <div className="border-y border-slate-100 bg-white py-8">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
          Infraestrutura regulatória parceira
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale">
          {[
            "Divify",
            "CVM",
            "Banco Central",
            "Pagar.me",
            "Stark Bank",
          ].map((name) => (
            <span key={name} className="text-sm font-bold tracking-wide text-slate-500">{name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Como Funciona ───────────────────────────────────── */
function ComoFunciona(): ReactNode {
  const steps = [
    {
      num: "01",
      label: "Submeta o projeto",
      desc: "Preencha o formulário com dados do empreendimento, documentos e equipe. Simples, digital, sem papelada.",
      icon: FileCheck,
      color: "bg-blue-500",
    },
    {
      num: "02",
      label: "Curadoria Atlas Hub",
      desc: "Nossa equipe analisa viabilidade, localização e documentação. Resposta em até 5 dias úteis.",
      icon: ShieldCheck,
      color: "bg-amber-500",
    },
    {
      num: "03",
      label: "Oferta vai ao ar",
      desc: "Publicamos a oferta na plataforma regulada pela CVM 88. Investidores de todo o Brasil acessam.",
      icon: TrendingUp,
      color: "bg-navy",
    },
    {
      num: "04",
      label: "Recursos liberados",
      desc: "Ao bater a meta, os recursos vão direto para a sua SPE. Sem intermediários, sem atrasos.",
      icon: Banknote,
      color: "bg-gold",
    },
  ];

  return (
    <section id="como-funciona" className="bg-[#F8FAFC] py-24 lg:py-32">
      <div className="container-max section-pad py-0">
        <div className="mb-16 max-w-xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-navy">Processo</p>
          <h2 className="text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Do projeto à captação em{" "}
            <span className="text-gradient-navy">4 etapas</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Toda a estrutura regulatória já está montada. Você só precisa do projeto.
          </p>
        </div>

        <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connector line desktop */}
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent lg:block" />

          {steps.map(({ num, label, desc, icon: Icon, color }) => (
            <div key={num} className="relative card p-6 card-lift">
              <div className={cn("mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm", color)}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-black text-slate-300">{num}</span>
              <h3 className="mt-1 text-base font-bold text-slate-900">{label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Para Incorporadoras ─────────────────────────────── */
function ParaIncorporadoras(): ReactNode {
  const benefits = [
    { icon: Banknote,   title: "Taxa única de 10%",          desc: "Sem juros mensais durante a obra. Você sabe exatamente o que vai custar antes de começar." },
    { icon: Clock,      title: "Resposta em até 5 dias",     desc: "Nossa curadoria é ágil. Sem filas, sem burocracia, sem reuniões desnecessárias." },
    { icon: Users,      title: "Acesso a investidores",      desc: "Sua oferta alcança investidores qualificados de todo o Brasil interessados em imóveis." },
    { icon: ShieldCheck,title: "Estrutura jurídica pronta",  desc: "SPE, SCP, contratos e documentação CVM 88 — tudo já montado para você usar." },
    { icon: TrendingUp, title: "Obra em andamento converte", desc: "Projetos com obra iniciada atraem mais investidores. A plataforma mostra isso em destaque." },
    { icon: Lock,       title: "Patrimônio de afetação",     desc: "Seu projeto fica protegido do seu patrimônio pessoal. Mais segurança para todos." },
  ];

  return (
    <section id="incorporadoras" className="bg-white py-24 lg:py-32">
      <div className="container-max section-pad py-0">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">

          {/* Left */}
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-navy">Para Incorporadoras</p>
            <h2 className="text-4xl font-black leading-[1.15] tracking-tight text-slate-900 sm:text-5xl">
              Financiamento bancário
              <br />
              <span className="line-through text-slate-300">a 1,8% ao mês</span>
              {" "}ou{" "}
              <span className="text-gradient-gold">10% total</span>
            </h2>
            <p className="mt-5 text-lg text-slate-500 leading-relaxed">
              Em 18 meses de obra, o banco cobra o equivalente a 37% do valor financiado.
              A Atlas Hub cobra 10% — uma única vez, sobre o que você captar.
            </p>

            {/* Comparison box */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Banco tradicional</p>
                  <p className="mt-3 text-3xl font-black text-red-500">~37%</p>
                  <p className="mt-1 text-xs text-slate-400">em 18 meses de obra (1,8% a.m.)</p>
                  <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
                    <li className="flex items-center gap-1.5"><X className="h-3 w-3 text-red-400" /> Taxas de cartório</li>
                    <li className="flex items-center gap-1.5"><X className="h-3 w-3 text-red-400" /> Garantias reais</li>
                    <li className="flex items-center gap-1.5"><X className="h-3 w-3 text-red-400" /> Burocracia lenta</li>
                  </ul>
                </div>
                <div className="bg-navy p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-navy-200">Atlas Hub</p>
                  <p className="mt-3 text-3xl font-black text-gold">10%</p>
                  <p className="mt-1 text-xs text-navy-200/60">uma vez, sobre o captado</p>
                  <ul className="mt-4 space-y-1.5 text-xs text-navy-200">
                    <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-400" /> Zero taxas de cartório</li>
                    <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-400" /> 100% digital</li>
                    <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-400" /> Resposta em 5 dias</li>
                  </ul>
                </div>
              </div>
            </div>

            <Link to="/cadastro" className="btn btn-navy btn-lg mt-8 inline-flex rounded-2xl">
              Cadastrar meu projeto <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Right — benefit cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card card-lift p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50">
                  <Icon className="h-4 w-4 text-navy" />
                </div>
                <p className="text-sm font-bold text-slate-800">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Para Investidores ───────────────────────────────── */
function ParaInvestidores(): ReactNode {
  return (
    <section id="investidores" className="relative overflow-hidden bg-[#0d1830] py-24 lg:py-32">
      {/* Blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full opacity-20 blur-[80px]" style={{ background: "radial-gradient(circle, #C49020 0%, transparent 70%)" }} />
      </div>

      <div className="container-max section-pad relative py-0">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">

          {/* Left cards */}
          <div className="order-2 lg:order-1 grid gap-4">
            {[
              { tag: "Rentabilidade",  icon: TrendingUp,  color: "text-green-400",  title: "Acima da Selic",               desc: "Projetos imobiliários curados com rentabilidade estimada entre 15% e 30% a.a." },
              { tag: "Segurança",      icon: ShieldCheck, color: "text-blue-400",   title: "Curadoria rigorosa",            desc: "Cada projeto passa por análise de localização, viabilidade financeira e documentação." },
              { tag: "Regulamentação", icon: Lock,        color: "text-gold",       title: "CVM 88 — 100% regulamentado",   desc: "Contratos, escrow automático, direito de desistência — tudo conforme a lei." },
            ].map(({ tag, icon: Icon, color, title, desc }) => (
              <div key={title} className="card-glass flex gap-4 p-5">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                  <Icon className={cn("h-5 w-5", color)} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{tag}</p>
                  <p className="mt-0.5 font-bold text-white">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/50">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right text */}
          <div className="order-1 lg:order-2">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-gold">Para Investidores</p>
            <h2 className="text-4xl font-black leading-[1.15] tracking-tight text-white sm:text-5xl">
              Imóveis fracionados{" "}
              <br />
              <span className="text-gradient-gold">a partir de R$10</span>
            </h2>
            <p className="mt-5 text-lg text-white/55 leading-relaxed">
              Participe de projetos imobiliários curados com as mesmas vantagens dos grandes fundos —
              fracionado, digital e totalmente regulamentado.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                "Depósito e saque via PIX em segundos",
                "Acompanhe seus investimentos em tempo real",
                "Cancelamento garantido em até 5 dias (CVM 88)",
                "Mercado secundário para liquidez antecipada",
                "Informe de rendimentos automático para o IR",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-white/60">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Numbers ─────────────────────────────────────────── */
function Numeros(): ReactNode {
  const items = [
    { value: "10%",     label: "Taxa única sobre o captado",        sub: "vs. 37% do banco em 18 meses" },
    { value: "5 dias",  label: "Prazo de análise da curadoria",     sub: "processo 100% digital" },
    { value: "R$15M",   label: "Limite por oferta pública",         sub: "regulado pela CVM Resolução 88" },
    { value: "R$10",    label: "Investimento mínimo por cota",       sub: "acesso democratizado" },
  ];

  return (
    <section className="bg-navy py-16">
      <div className="container-max px-5 lg:px-8">
        <div className="grid grid-cols-2 gap-px sm:grid-cols-4 bg-white/10 overflow-hidden rounded-2xl lg:grid-cols-4">
          {items.map(({ value, label, sub }) => (
            <div key={label} className="bg-navy px-8 py-9 text-center">
              <p className="text-4xl font-black text-gold lg:text-5xl">{value}</p>
              <p className="mt-2 text-sm font-semibold text-white/80">{label}</p>
              <p className="mt-1 text-xs text-white/35">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Depoimentos ─────────────────────────────────────── */
function Depoimentos(): ReactNode {
  const items = [
    {
      quote: "Financiávamos com banco a 1,8% ao mês. Com a Atlas Hub, pagamos 10% sobre o captado uma única vez. A economia foi enorme e conseguimos escalar para 3 projetos simultâneos.",
      nome: "R. Santos",
      cargo: "Diretor — Construtora Horizonte Ltda",
      cidade: "São Paulo, SP",
    },
    {
      quote: "O processo foi impressionante: submeti terça, aprovado na quinta, oferta publicada na semana seguinte. Em 3 semanas captamos 60% da meta. Nunca vi isso com banco.",
      nome: "M. Ferreira",
      cargo: "Sócio — Incorporadora Villa Verde",
      cidade: "Campinas, SP",
    },
    {
      quote: "Precisávamos de R$800k para tocar a obra sem sócio financeiro. A plataforma nos deu acesso a dezenas de investidores de forma organizada, segura e totalmente regulamentada.",
      nome: "C. Oliveira",
      cargo: "CEO — Serra Alta Empreendimentos",
      cidade: "Balneário Camboriú, SC",
    },
  ];

  return (
    <section className="bg-[#F8FAFC] py-24 lg:py-32">
      <div className="container-max section-pad py-0">
        <div className="mb-14">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-navy">Depoimentos</p>
          <h2 className="max-w-xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Incorporadoras que escolheram a{" "}
            <span className="text-gradient-navy">captação inteligente</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map(({ quote, nome, cargo, cidade }) => (
            <div key={nome} className="card p-7 card-lift flex flex-col">
              {/* Stars */}
              <div className="mb-5 flex gap-1">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-slate-600">"{quote}"</p>
              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-sm font-black text-white">
                  {nome.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{nome}</p>
                  <p className="text-xs text-slate-400">{cargo}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="h-3 w-3" />{cidade}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ─────────────────────────────────────────────── */
function Faq(): ReactNode {
  const [open, setOpen] = useState<number | null>(null);

  const items = [
    { q: "Quanto custa usar a plataforma?",             a: "A taxa é de apenas 10% sobre o valor captado, cobrada uma única vez. Não há mensalidades, taxas de cartório ou cobranças ocultas." },
    { q: "Quanto tempo leva a análise do meu projeto?", a: "Nossa curadoria responde em até 5 dias úteis. O processo é 100% digital — você acompanha o status em tempo real pelo painel." },
    { q: "Precisa de SPE para captar?",                 a: "Sim. A SPE (Sociedade de Propósito Específico) é exigida pela CVM 88 para captação pública. Podemos indicar assessoria jurídica para a constituição." },
    { q: "Qual o valor máximo de captação?",            a: "Pela CVM Resolução 88, o limite é de R$15 milhões por SPE por ano em oferta pública. Para valores maiores, trabalhamos com ofertas privadas (club deal)." },
    { q: "O investidor pode desistir depois de aportar?", a: "Sim. A CVM 88 garante ao investidor 5 dias para cancelar o investimento sem penalidade. Após esse prazo, a cota é definitiva." },
  ];

  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="container-max section-pad py-0">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-navy">Dúvidas</p>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Perguntas frequentes
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Tem outra dúvida? Entre em contato — respondemos em menos de 24h.
            </p>
            <div className="mt-8 flex items-center gap-3 rounded-2xl bg-navy-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-navy">Fale com a gente</p>
                <p className="text-xs text-slate-500">contato@atlashub.com.br</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden">
            {items.map(({ q, a }, i) => (
              <div key={q}>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white"
                >
                  <span className="text-sm font-semibold text-slate-800">{q}</span>
                  <span className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all",
                    open === i && "rotate-45 border-navy text-navy",
                  )}>
                    <ArrowRight className="h-3 w-3 rotate-[-45deg]" />
                  </span>
                </button>
                {open === i && (
                  <div className="animate-in px-6 pb-5">
                    <p className="text-sm leading-relaxed text-slate-500">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CTA final ───────────────────────────────────────── */
function CtaFinal(): ReactNode {
  return (
    <section className="relative overflow-hidden bg-navy py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full opacity-20 blur-[80px]" style={{ background: "radial-gradient(circle, #C49020, transparent)" }} />
      </div>

      <div className="container-max relative px-5 text-center lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-white/40">Pronto para começar?</p>
          <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            Seu próximo projeto começa aqui
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/55">
            Cadastre sua incorporadora gratuitamente. Nossa curadoria analisa seu projeto em até 5 dias úteis.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/cadastro"
              className="group inline-flex items-center gap-2.5 rounded-2xl bg-gold px-8 py-4 text-base font-bold text-white shadow-gold-sm transition-all hover:bg-gold-light hover:shadow-[0_4px_20px_rgb(196,144,32,0.5)] active:scale-[0.98]"
            >
              Criar conta gratuitamente
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-8 py-4 text-base font-medium text-white/70 transition-all hover:border-white/30 hover:bg-white/5"
            >
              Já tenho conta
            </Link>
          </div>

          <p className="mt-6 text-xs text-white/25">
            Sem taxa de cadastro · Curadoria em até 5 dias · CVM Resolução 88
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────── */
function Footer(): ReactNode {
  return (
    <footer className="bg-[#080f1f] py-14">
      <div className="container-max px-5 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <Logo size="md" scheme="dark" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/35">
              Plataforma de crowdfunding imobiliário regulada pela CVM Resolução 88.
              Conectamos incorporadoras e investidores de forma segura e transparente.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-white/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Licenciado pela Divify · Regulado pela CVM
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/30">Plataforma</p>
            <ul className="space-y-3 text-sm text-white/40">
              {["Para Incorporadoras","Para Investidores","Como Funciona","Regulamentação"].map((item) => (
                <li key={item}><a href="#" className="transition-colors hover:text-white/70">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/30">Conta</p>
            <ul className="space-y-3 text-sm text-white/40">
              <li><Link to="/login"    className="transition-colors hover:text-white/70">Entrar</Link></li>
              <li><Link to="/cadastro" className="transition-colors hover:text-white/70">Cadastrar Incorporadora</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-xs text-white/20">© 2026 Atlas Hub. Todos os direitos reservados.</p>
          <p className="text-xs text-white/15">Investimentos envolvem riscos. Leia o prospecto antes de investir.</p>
        </div>
      </div>
    </footer>
  );
}

/* ── Page ─────────────────────────────────────────────── */
export default function LandingPage(): ReactNode {
  return (
    <>
      <Navbar />
      <Hero />
      <TrustBar />
      <ComoFunciona />
      <ParaIncorporadoras />
      <ParaInvestidores />
      <Numeros />
      <Depoimentos />
      <Faq />
      <CtaFinal />
      <Footer />
    </>
  );
}
