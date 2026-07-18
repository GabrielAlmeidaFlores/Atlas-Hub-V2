import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Banknote, Building2, CheckCircle, Clock, FileCheck,
  Lock, ShieldCheck, BarChart3, TrendingUp, Bell, Users,
} from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { WhatsappLink } from "@/components/shared/whatsapp-cta";
import { MarketingShell } from "@/features/landing/components/marketing-shell";

const STEPS = [
  {
    title: "Cadastre a incorporadora",
    desc: "Crie a conta com CNPJ, responsável e e-mail. Confirme o e-mail e complete o perfil (endereço, histórico, contrato social).",
  },
  {
    title: "Monte o projeto no wizard",
    desc: "Cinco etapas: dados do empreendimento, financeiro (incluindo viabilidade), documentos obrigatórios, equipe e revisão. O progresso salva como rascunho.",
  },
  {
    title: "Submeta à curadoria Atlas",
    desc: "Nossa equipe analisa com scorecard (localização, viabilidade, documentação, equipe e risco). Podemos pedir ajuste, reprovar ou aprovar.",
  },
  {
    title: "Oferta publicada para investidores",
    desc: "Após aprovação, a oferta é criada na plataforma de investimento Atlas Hub (pública CVM 88 ou privada). Você recebe o link para acompanhar e divulgar.",
  },
] as const;

const BENEFITS = [
  {
    icon: Banknote,
    title: "Sem juros bancários na obra",
    desc: "Custo previsível: 10% sobre o captado (spread da oferta), sem parcela mensal de financiamento tradicional.",
  },
  {
    icon: Clock,
    title: "Capital enquanto constrói",
    desc: "A captação ocorre com o projeto em andamento — útil quando o crédito bancário trava ou atrasa.",
  },
  {
    icon: ShieldCheck,
    title: "Curadoria que protege a marca",
    desc: "Só projetos aprovados vão ao ar. Compliance CVM (afetação, seguro de obra, SPE/SCP) validado antes da oferta.",
  },
  {
    icon: Users,
    title: "Base de investidores Atlas",
    desc: "A vitrine, KYC, PIX e escrow ficam na experiência de investimento Atlas Hub — o investidor vê só a marca Atlas.",
  },
] as const;

const PORTAL = [
  { icon: Building2, title: "Perfil da empresa", desc: "Dados cadastrais e documentos da incorporadora." },
  { icon: FileCheck, title: "Wizard de projeto", desc: "Rascunho, upload de docs/fotos e equipe do empreendimento." },
  { icon: BarChart3, title: "Status e histórico", desc: "Acompanhe análise, pedidos de ajuste e decisões." },
  { icon: Bell, title: "Notificações", desc: "Avisos in-app (e e-mail quando o SES estiver ativo) a cada mudança." },
  { icon: TrendingUp, title: "Link da oferta", desc: "Quando publicada, o link da oferta fica disponível no detalhe do projeto." },
  { icon: Lock, title: "Resubmissão", desc: "Se houver ajuste ou reprova, corrija e envie de novo sem limite artificial." },
] as const;

export default function ParaIncorporadorasPage(): ReactNode {
  return (
    <MarketingShell>
      <section className="lp-hero-bg relative overflow-hidden pb-16 pt-14">
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gold">Para incorporadoras</p>
          <h1 className="lp-hero-title max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
            Capte recursos com investidores — sem depender só do banco
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
            O Atlas Hub é o originador: você submete o empreendimento, nossa curadoria valida, e a oferta sobe na plataforma de investimento Atlas Hub para o público investir com KYC, escrow e regras CVM.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/cadastro" className="btn btn-gold btn-lp inline-flex items-center gap-2 text-sm font-bold">
              Cadastrar incorporadora <ArrowRight className="h-4 w-4" />
            </Link>
            <WhatsappLink variant="hero">Falar com suporte</WhatsappLink>
            <Link to="/para-investidores" className="btn btn-lp inline-flex items-center justify-center border-2 border-white/20 bg-transparent text-sm font-bold text-white hover:bg-white/5">
              Ver lado do investidor
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-6xl px-6">
          <AnimateIn>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-navy">Ecossistema</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Duas frentes, uma marca</h2>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              No dia a dia você usa o <strong className="text-foreground">Portal da Incorporadora</strong> (este sistema).
              Depois da aprovação, a <strong className="text-foreground">oferta vive na plataforma de investimento Atlas Hub</strong>,
              onde investidores se cadastram, fazem KYC e aportam via PIX — com conta escrow e regras CVM automáticas.
            </p>
          </AnimateIn>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <AnimateIn className="border border-border bg-card p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold">Você (incorporadora)</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Cadastro e perfil no portal Atlas</li>
                <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Submissão e ajustes do projeto</li>
                <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Feedback da curadoria</li>
                <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Link da oferta quando publicada</li>
              </ul>
            </AnimateIn>
            <AnimateIn delay={100} className="border border-border bg-card p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-navy">Investidor (marca Atlas)</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Vitrine e página da oferta</li>
                <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> KYC PF/PJ e aporte via PIX</li>
                <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Escrow, cotas tokenizadas e carteira</li>
                <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Triggers CVM (sucesso / devolução)</li>
              </ul>
            </AnimateIn>
          </div>
        </div>
      </section>

      <section className="lp-section-alt py-16">
        <div className="mx-auto max-w-6xl px-6">
          <AnimateIn className="mb-10">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-navy">Passo a passo</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Como funciona na prática</h2>
          </AnimateIn>
          <ol className="space-y-0 border border-border">
            {STEPS.map((step, i) => (
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
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gold">Benefícios</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Por que usar o Atlas Hub</h2>
          </AnimateIn>
          <div className="grid gap-4 sm:grid-cols-2">
            {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 80} className="lp-feature-card">
                <Icon className="mb-3 h-5 w-5 text-navy" />
                <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section-alt py-16">
        <div className="mx-auto max-w-6xl px-6">
          <AnimateIn className="mb-10">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-navy">Portal</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">O que você encontra no sistema</h2>
          </AnimateIn>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PORTAL.map(({ icon: Icon, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 60} className="border border-border bg-card p-5">
                <Icon className="mb-3 h-4 w-4 text-navy" />
                <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <AnimateIn>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-navy">Requisitos</p>
            <h2 className="text-2xl font-extrabold tracking-tight">Antes da oferta ir ao ar</h2>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Receita bruta anual até R$40M (elegibilidade CVM 88)</li>
              <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Captação por oferta até R$15M</li>
              <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Patrimônio de afetação, seguro de obra e SPE/SCP (validados na curadoria)</li>
              <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Documentação do terreno e viabilidade no wizard</li>
            </ul>
          </AnimateIn>
          <AnimateIn delay={120} className="mt-10 flex flex-col gap-3 border border-border bg-card p-8 text-center sm:flex-row sm:items-center sm:justify-center">
            <Link to="/cadastro" className="btn btn-navy btn-lp inline-flex items-center justify-center gap-2">
              Criar conta <ArrowRight className="h-4 w-4" />
            </Link>
            <WhatsappLink variant="outline">Tirar dúvidas no WhatsApp</WhatsappLink>
          </AnimateIn>
        </div>
      </section>
    </MarketingShell>
  );
}
