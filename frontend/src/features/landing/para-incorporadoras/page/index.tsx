import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Banknote, CheckCircle, Clock,
  ShieldCheck, Users,
} from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { WhatsappLink } from "@/components/shared/whatsapp-cta";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { useLandingAnalytics } from "@/lib/analytics/use-landing-analytics";

function IncorporadorasHero(): ReactNode {
  return (
    <section
      className="relative overflow-visible bg-gradient-to-b from-[#D1D1D6] via-[#E7E7EA] via-40% to-white to-65% px-4 pb-[40px] pt-5 sm:px-6 lg:px-8"
      data-analytics-section="hero"
    >
      <div className="relative min-h-[480px] overflow-hidden rounded-[14px] bg-[#001F4E] shadow-[0_10px_30px_rgba(7,17,34,0.18)] sm:min-h-[520px] lg:min-h-[557px]">
        <img
          src="/bg-incorporadoras.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-left"
        />
        <div className="lp-container relative flex min-h-[480px] items-center py-8 sm:min-h-[520px] lg:min-h-[557px] lg:py-4">
          <div className="relative z-10 max-w-[720px]">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#D2A047]">
              Para incorporadoras
            </p>
            <h1 className="text-[32px] font-extrabold uppercase leading-[1.08] tracking-[0.04em] text-white sm:text-[38px] lg:text-[44px]">
              Capture recursos sem
              <br />
              financiamento bancário
            </h1>
            <p className="mt-5 max-w-[640px] text-[15px] font-normal leading-relaxed text-white/95 sm:text-[16px]">
              Apresente seu projeto, passe pela nossa curadoria e conte com a Atlas Hub para atrair investidores.
            </p>
            <Link
              to="/cadastro"
              data-analytics-cta="inc_hero_cadastro"
              className="mt-8 inline-flex h-10 items-center justify-center rounded-[4px] bg-[#D2A047] px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
            >
              Solicitar avaliação do meu projeto
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

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
  {
    image: "/lp/portal-perfil.jpg",
    title: "Perfil da empresa",
    desc: "Dados cadastrais e documentos da incorporadora.",
  },
  {
    image: "/lp/portal-wizard.jpg",
    title: "Wizard de projeto",
    desc: "Rascunho, upload de docs/fotos e equipe do empreendimento.",
  },
  {
    image: "/lp/portal-status.jpg",
    title: "Status e histórico",
    desc: "Acompanhe análise, pedidos de ajuste e decisões.",
  },
  {
    image: "/lp/portal-notificacoes.jpg",
    title: "Notificações",
    desc: "Avisos in-app (e e-mail quando o SES estiver ativo) a cada mudança.",
  },
  {
    image: "/lp/portal-oferta.jpg",
    title: "Link da oferta",
    desc: "Quando publicada, o link da oferta fica disponível no detalhe do projeto.",
  },
  {
    image: "/lp/portal-resubmissao.jpg",
    title: "Resubmissão",
    desc: "Se houver ajuste ou reprova, corrija e envie de novo sem limite artificial.",
  },
] as const;

export default function ParaIncorporadorasPage(): ReactNode {
  useLandingAnalytics(true);
  return (
    <MarketingShell>
      <IncorporadorasHero />

      <section className="border-b border-border py-16">
        <div className="lp-container">
          <AnimateIn>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gold">Ecossistema</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Duas frentes, uma marca</h2>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              No dia a dia você usa o <strong className="text-foreground">Portal da Incorporadora</strong> (este sistema).
              Depois da aprovação, a <strong className="text-foreground">oferta vive na plataforma de investimento Atlas Hub</strong>,
              onde investidores se cadastram, fazem KYC e aportam via PIX — com conta escrow e regras CVM automáticas.
            </p>
          </AnimateIn>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <AnimateIn className="rounded-[8px] border border-border bg-card p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold">Você (incorporadora)</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Cadastro e perfil no portal Atlas</li>
                <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Submissão e ajustes do projeto</li>
                <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Feedback da curadoria</li>
                <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Link da oferta quando publicada</li>
              </ul>
            </AnimateIn>
            <AnimateIn delay={100} className="rounded-[8px] border border-border bg-card p-6">
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
        <div className="lp-container">
          <AnimateIn className="mb-10">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gold">Passo a passo</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Como funciona na prática</h2>
          </AnimateIn>
          <ol className="space-y-0 overflow-hidden rounded-[8px] border border-border">
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
        <div className="lp-container">
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
        <div className="lp-container">
          <AnimateIn className="mb-10">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gold">Portal</p>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">O que você encontra no sistema</h2>
          </AnimateIn>
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PORTAL.map(({ image, title, desc }, i) => (
              <AnimateIn key={title} delay={i * 60} className="lp-feature-card-gold overflow-hidden p-0">
                <div className="h-28 overflow-hidden sm:h-32">
                  <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
                </div>
                <div className="p-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-navy">{title}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <AnimateIn className="rounded-[8px] border border-border bg-card p-8 sm:p-10">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gold">Requisitos</p>
            <h2 className="text-2xl font-extrabold tracking-tight">Antes da oferta ir ao ar</h2>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Receita bruta anual até R$40M (elegibilidade CVM 88)</li>
              <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Captação por oferta até R$15M</li>
              <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Patrimônio de afetação, seguro de obra e SPE/SCP (validados na curadoria)</li>
              <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-navy" /> Documentação do terreno e viabilidade no wizard</li>
            </ul>
            <div className="mt-10 flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-center">
              <Link to="/cadastro" data-analytics-cta="inc_cadastro" className="btn btn-navy btn-lp inline-flex items-center justify-center gap-2">
                Criar conta <ArrowRight className="h-4 w-4" />
              </Link>
              <WhatsappLink variant="outline">Tirar dúvidas no WhatsApp</WhatsappLink>
            </div>
          </AnimateIn>
        </div>
      </section>
    </MarketingShell>
  );
}
