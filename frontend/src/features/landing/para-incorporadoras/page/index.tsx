import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight, MapPin, BarChart3, Building2, FileCheck,
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
      <div className="relative min-h-[557px] overflow-hidden rounded-[14px] bg-[#001F4E] shadow-[0_10px_30px_rgba(7,17,34,0.18)] lg:min-h-[600px]">
        <img
          src="/bg-incorporadoras.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="lp-container relative flex min-h-[557px] items-center py-3 lg:min-h-[600px] lg:py-4">
          <div className="relative z-10 max-w-[720px]">
            <p className="mb-5 text-[11px] uppercase tracking-[0.32em] text-[#D2A047]">
              <span className="font-light">Para </span>
              <span className="font-semibold">incorporadoras</span>
            </p>
            <h1 className="text-[32px] font-extrabold uppercase leading-[1.08] tracking-[0.04em] text-white sm:text-[38px] lg:text-[44px]">
              capture recursos
              <br />
              sem financiamento
              <br />
              bancário
            </h1>
            <p className="mt-5 text-[20px] font-medium leading-snug tracking-[-0.04em] text-[#D2A047] sm:text-[24px]">
              Apresente seu projeto, passe pela nossa curadoria e conte com a Atlas Hub para atrair investidores.
            </p>
            <Link
              to="/cadastro"
              data-analytics-cta="inc_hero_cadastro"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-[4px] bg-[#D2A047] px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
            >
              Solicitar avaliação do meu projeto
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const CAPTAR_PASSOS = [
  { n: "01", desc: "Envie os dados do seu projeto para avaliação.", bg: "#3F629C" },
  { n: "02", desc: "Nossa equipe faz a curadoria técnica (localização, viabilidade, documentação).", bg: "#294574" },
  { n: "03", desc: "Projetos aprovados são publicados para captação de investidores.", bg: "#1C2E5E" },
  { n: "04", desc: "Acompanhe a captação e o repasse dos recursos pela área da incorporadora.", bg: "#161F48" },
] as const;

function CapitarPassos(): ReactNode {
  return (
    <section className="bg-white py-14 lg:py-16" data-analytics-section="como-captar">
      <div className="lp-container flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
        <AnimateIn className="shrink-0 lg:w-[22%]">
          <h2 className="text-[40px] font-bold uppercase leading-[1.05] tracking-[-0.06em] text-navy sm:text-[44px] lg:text-[48px]">
            Como captar em
            <br />
            <span className="text-[#D2A047]">4 passos</span>
          </h2>
        </AnimateIn>
        <div className="grid flex-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {CAPTAR_PASSOS.map(({ n, desc, bg }, i) => (
            <AnimateIn key={n} delay={i * 70} className="relative pt-8 pb-6">
              <div
                className="relative flex min-h-[9.2rem] flex-col items-center justify-center rounded-[10px] px-4 pb-9 pt-8 text-center sm:min-h-[10rem]"
                style={{ backgroundColor: bg }}
              >
                <div
                  className="absolute -top-9 left-1/2 -translate-x-1/2 rounded-full border-[3px] border-white bg-[#0F1F38] p-1.5"
                  aria-hidden
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0F1F38] text-xl font-extrabold text-white shadow-[0_0_0_3px_white]">
                    {n}
                  </div>
                </div>
                <p className="text-[13px] font-semibold leading-snug text-white sm:text-sm">{desc}</p>
                <span
                  className="absolute -bottom-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#1C2E5E] bg-white"
                  aria-hidden
                >
                  <ChevronRight className="h-6 w-6 text-[#1C2E5E]" strokeWidth={2.5} />
                </span>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}

const AVALIACAO_CRITERIOS = [
  { icon: MapPin, title: "Localização e potencial", desc: "Localização e potencial da região do empreendimento." },
  { icon: BarChart3, title: "Viabilidade técnica", desc: "Viabilidade técnica e financeira do projeto." },
  { icon: Building2, title: "Histórico e capacidade", desc: "Histórico e capacidade de entrega da incorporadora." },
  { icon: FileCheck, title: "Documentação", desc: "Documentação societária de regularização e registros." },
] as const;

function AvaliacaoProjeto(): ReactNode {
  return (
    <section className="bg-[#001F4E] py-14 lg:py-16" data-analytics-section="avaliacao">
      <div className="lp-container">
        <AnimateIn className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#D2A047]">
            O que avaliamos antes de
          </p>
          <h2 className="text-[40px] font-bold uppercase leading-[1.05] tracking-[-0.06em] text-white sm:text-[44px] lg:text-[48px]">
            Aprovar um projeto
          </h2>
        </AnimateIn>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {AVALIACAO_CRITERIOS.map(({ icon: Icon, title, desc }, i) => (
            <AnimateIn key={title} delay={i * 70} className="flex flex-col items-center rounded-[12px] border border-[#D2A047]/40 bg-[#0F1F38] px-6 py-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#D2A047] bg-transparent">
                <Icon className="h-6 w-6 text-[#D2A047]" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-white">{title}</h3>
              <p className="mt-3 text-xs leading-relaxed text-white/80">{desc}</p>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function SoliciteAvaliacao(): ReactNode {
  const [formData, setFormData] = useState({ nome: "", email: "", telefone: "", projeto: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <section className="bg-white py-14 lg:py-16" data-analytics-section="solicite-avaliacao">
      <div className="lp-container grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <AnimateIn className="lg:col-span-5">
          <h2 className="text-[40px] font-bold uppercase leading-[1.08] tracking-[-0.06em] text-navy sm:text-[44px] lg:text-[48px]">
            Solicite a
            <br />
            <span className="text-[#D2A047]">Avaliação do seu projeto</span>
          </h2>
        </AnimateIn>
        <AnimateIn delay={80} className="lg:col-span-7">
          <form className="flex flex-col gap-4">
            <input
              type="text"
              name="nome"
              placeholder="Nome da empresa"
              value={formData.nome}
              onChange={handleChange}
              className="rounded-[4px] border border-[#1C2E5E] bg-white px-4 py-3 text-sm text-[#3A3A3A] placeholder-[#999999] focus:border-[#D2A047] focus:outline-none focus:ring-1 focus:ring-[#D2A047]"
            />
            <input
              type="email"
              name="email"
              placeholder="E-mail de contato"
              value={formData.email}
              onChange={handleChange}
              className="rounded-[4px] border border-[#1C2E5E] bg-white px-4 py-3 text-sm text-[#3A3A3A] placeholder-[#999999] focus:border-[#D2A047] focus:outline-none focus:ring-1 focus:ring-[#D2A047]"
            />
            <input
              type="tel"
              name="telefone"
              placeholder="Telefone para contato"
              value={formData.telefone}
              onChange={handleChange}
              className="rounded-[4px] border border-[#1C2E5E] bg-white px-4 py-3 text-sm text-[#3A3A3A] placeholder-[#999999] focus:border-[#D2A047] focus:outline-none focus:ring-1 focus:ring-[#D2A047]"
            />
            <textarea
              name="projeto"
              placeholder="Descreva seu empreendimento"
              value={formData.projeto}
              onChange={handleChange}
              rows={3}
              className="rounded-[4px] border border-[#1C2E5E] bg-white px-4 py-3 text-sm text-[#3A3A3A] placeholder-[#999999] focus:border-[#D2A047] focus:outline-none focus:ring-1 focus:ring-[#D2A047]"
            />
            <button
              type="submit"
              className="mt-2 inline-flex h-12 w-fit items-center justify-center rounded-[4px] bg-[#D2A047] px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
            >
              Enviar projeto para avaliação
            </button>
          </form>
        </AnimateIn>
      </div>
    </section>
  );
}

export default function ParaIncorporadorasPage(): ReactNode {
  useLandingAnalytics(true);
  return (
    <MarketingShell>
      <IncorporadorasHero />
      <CapitarPassos />
      <AvaliacaoProjeto />
      <SoliciteAvaliacao />
    </MarketingShell>
  );
}
