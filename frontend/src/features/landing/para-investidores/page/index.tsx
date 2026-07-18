import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, CheckCircle, ShieldCheck, Wallet, Landmark,
  FileText, RefreshCw, LineChart, Lock, Building2, Coins,
} from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { WhatsappLink } from "@/components/shared/whatsapp-cta";
import { MarketingShell } from "@/features/landing/components/marketing-shell";

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
    icon: Landmark,
    title: "Escrow por oferta",
    desc: "Recursos ficam segregados na conta da oferta até os gatilhos CVM liberarem ou devolverem.",
  },
  {
    icon: ShieldCheck,
    title: "Triggers CVM",
    desc: "Atingiu 2/3 da meta no prazo: libera ao emissor. Insucesso: devolução integral aos investidores.",
  },
  {
    icon: Lock,
    title: "Curadoria prévia",
    desc: "Só entram ofertas de projetos aprovados pela equipe Atlas (documentação, risco e elegibilidade).",
  },
  {
    icon: FileText,
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

export default function ParaInvestidoresPage(): ReactNode {
  return (
    <MarketingShell>
      <section className="lp-hero-bg relative overflow-hidden pb-16 pt-14">
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gold">Para investidores</p>
          <h1 className="lp-hero-title max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
            Invista em imóveis com curadoria Atlas e regras CVM
          </h1>
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

      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-6xl px-6">
          <AnimateIn>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-navy">Como se encaixa</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Incorporadora originadora · você investe</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Incorporadoras submetem projetos no portal Atlas e passam por curadoria humana.
              Só depois a oferta aparece na <strong className="text-foreground">plataforma de investimento Atlas Hub</strong>,
              onde você avalia, investe e acompanha — com escrow, tokenização de cotas e proteção dos gatilhos CVM.
            </p>
          </AnimateIn>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {(
              [
                ["1. Originação", "Projeto entra pelo portal da incorporadora"],
                ["2. Curadoria", "Atlas aprova ou pede ajuste"],
                ["3. Investimento", "Você aporta na oferta publicada"],
              ] as [string, string][]
            ).map(([t, d], i) => (
              <AnimateIn key={t} delay={i * 80} className="border border-border bg-card p-5">
                <p className="text-sm font-bold uppercase tracking-wider text-foreground">{t}</p>
                <p className="mt-2 text-xs text-muted-foreground">{d}</p>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section-alt py-16">
        <div className="mx-auto max-w-6xl px-6">
          <AnimateIn className="mb-10">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-navy">Jornada</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Do interesse ao retorno</h2>
          </AnimateIn>
          <ol className="space-y-0 border border-border">
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
        <div className="mx-auto max-w-6xl px-6">
          <AnimateIn className="mb-10">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gold">Proteção</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">O que reduz o risco operacional</h2>
          </AnimateIn>
          <div className="grid gap-4 sm:grid-cols-2">
            {PROTECTIONS.map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 80} className="lp-feature-card">
                <Icon className="mb-3 h-5 w-5 text-navy" />
                <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </AnimateIn>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Investimento em crowdfunding imobiliário envolve risco de perda de capital, prazo e liquidez. Leia os documentos da oferta antes de investir.
          </p>
        </div>
      </section>

      <section className="lp-section-alt py-16">
        <div className="mx-auto max-w-6xl px-6">
          <AnimateIn className="mb-10">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-navy">Plataforma</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">O que a experiência Atlas oferece</h2>
          </AnimateIn>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 60} className="border border-border bg-card p-5">
                <Icon className="mb-3 h-4 w-4 text-gold" />
                <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </AnimateIn>
            ))}
          </div>
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
