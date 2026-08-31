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
      <div className="relative min-h-[420px] overflow-hidden rounded-[14px] bg-[#001F4E] shadow-[0_10px_30px_rgba(7,17,34,0.18)] sm:min-h-[480px] lg:min-h-[600px]">
        <img
          src="/bg-incorporadoras.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="lp-container relative flex min-h-[420px] items-center py-6 sm:min-h-[480px] sm:py-3 lg:min-h-[600px] lg:py-4">
          <div className="relative z-10 max-w-[720px]">
            <p className="mb-5 text-[11px] uppercase tracking-[0.32em] text-[#D2A047]">
              <span className="font-light">Para </span>
              <span className="font-semibold">incorporadoras</span>
            </p>
            <h1 className="text-[28px] font-extrabold uppercase leading-[1.08] tracking-[0.04em] text-white sm:text-[32px] md:text-[38px] lg:text-[44px]">
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
  { n: "01", desc: "Envie os dados do seu projeto para avaliação.", color: "#3F629C" },
  { n: "02", desc: "Nossa equipe faz a curadoria técnica (localização, viabilidade, documentação).", color: "#294574" },
  { n: "03", desc: "Projetos aprovados são publicados para captação de investidores.", color: "#1C2E5E" },
  { n: "04", desc: "Acompanhe a captação e o repasse dos recursos pela área da incorporadora.", color: "#161F48" },
] as const;

function CapitarPassos(): ReactNode {
  return (
    <section className="bg-white py-14 lg:py-16" data-analytics-section="como-captar">
      <div className="lp-container flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
        <AnimateIn className="shrink-0 lg:w-[22%]">
          <h2 className="text-[32px] font-bold uppercase leading-[1.05] tracking-[-0.06em] text-navy sm:text-[40px] lg:text-[48px]">
            Como captar em
            <br />
            <span className="text-[#D2A047]">4 passos</span>
          </h2>
        </AnimateIn>
        <div className="grid flex-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {CAPTAR_PASSOS.map(({ n, desc, color }, i) => (
            <AnimateIn key={n} delay={i * 70} className="relative pt-9 pb-6">
              <div
                className="relative flex min-h-[9.2rem] flex-col items-center justify-center px-4 pb-9 pt-9 text-center sm:min-h-[10rem]"
                style={{
                  backgroundColor: color,
                  borderRadius: "10px",
                }}
              >
                <div
                  className="absolute -top-10 left-1/2 -translate-x-1/2 p-1 bg-white"
                  style={{
                    borderRadius: "9999px",
                    border: `1.5px solid ${color}`,
                  }}
                  aria-hidden
                >
                  <div
                    className="flex h-[4.25rem] w-[4.25rem] items-center justify-center text-[31px] font-extrabold text-white"
                    style={{
                      borderRadius: "9999px",
                      backgroundColor: color,
                    }}
                  >
                    {n}
                  </div>
                </div>
                <p className="text-[13px] font-normal leading-snug text-white sm:text-sm">{desc}</p>
                {i < CAPTAR_PASSOS.length - 1 && (
                  <span
                    className="absolute -bottom-5 left-1/2 hidden h-11 w-11 -translate-x-1/2 items-center justify-center bg-white xl:flex"
                    style={{
                      borderRadius: "9999px",
                      border: `2px solid ${color}`,
                    }}
                    aria-hidden
                  >
                    <ChevronRight className="h-5 w-5 text-[#1C2E5E]" strokeWidth={2.5} />
                  </span>
                )}
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
          <h2 className="text-[32px] font-bold uppercase leading-[1.05] tracking-[-0.06em] text-white sm:text-[40px] lg:text-[48px]">
            Aprovar um projeto
          </h2>
        </AnimateIn>
        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {AVALIACAO_CRITERIOS.map(({ icon: Icon, title, desc }, i) => (
            <AnimateIn key={title} delay={i * 70} className="relative flex flex-col items-center rounded-[12px] border-4 border-[#D9B366] px-6 pb-8 pt-10 text-center">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center">
                {title === "Localização e potencial" ? (
                  <svg width="55" height="55" viewBox="0 0 55 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="27.5" cy="27.5" r="27.5" fill="#D9B366" />
                    <path d="M28 28.0623C28.7563 28.0623 29.4036 27.7869 29.9422 27.2362C30.4807 26.6854 30.75 26.0233 30.75 25.2499C30.75 24.4764 30.4807 23.8143 29.9422 23.2636C29.4036 22.7128 28.7563 22.4374 28 22.4374C27.2437 22.4374 26.5964 22.7128 26.0578 23.2636C25.5193 23.8143 25.25 24.4764 25.25 25.2499C25.25 26.0233 25.5193 26.6854 26.0578 27.2362C26.5964 27.7869 27.2437 28.0623 28 28.0623ZM28 42.1246C24.3104 38.9137 21.5547 35.9314 19.7328 33.1775C17.9109 30.4236 17 27.8748 17 25.5311C17 22.0155 18.1057 19.2148 20.3172 17.1289C22.5286 15.043 25.0896 14 28 14C30.9104 14 33.4714 15.043 35.6828 17.1289C37.8943 19.2148 39 22.0155 39 25.5311C39 27.8748 38.0891 30.4236 36.2672 33.1775C34.4453 35.9314 31.6896 38.9137 28 42.1246Z" fill="#001F4E" />
                  </svg>
                ) : title === "Viabilidade técnica" ? (
                  <svg width="55" height="55" viewBox="0 0 55 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="27.5" cy="27.5" r="27.5" fill="#D9B366" />
                    <path d="M36 38.0935V24.9101M28 38.0935V17M20 38.0935V30.1834" stroke="#001F4E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : title === "Histórico e capacidade" ? (
                  <svg width="55" height="55" viewBox="0 0 55 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="27.5" cy="27.5" r="27.5" fill="#D9B366" />
                    <path d="M22.9005 25.7674H16V19.1007M16 25.7674L21.3364 20.923C22.9245 19.3912 24.985 18.3996 27.2072 18.0975C29.4294 17.7955 31.693 18.1993 33.657 19.2483C35.621 20.2972 37.1789 21.9343 38.0961 23.9131C39.0132 25.8918 39.2399 28.1049 38.742 30.2189C38.244 32.3329 37.0484 34.2333 35.3353 35.6338C33.6222 37.0343 31.4844 37.8589 29.244 37.9835C27.0036 38.108 24.782 37.5258 22.9139 36.3245C21.0458 35.1232 19.6324 33.3678 18.8867 31.323" stroke="#001F4E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : title === "Documentação" ? (
                  <svg width="55" height="55" viewBox="0 0 55 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="27.5" cy="27.5" r="27.5" fill="#D9B366" />
                    <g clipPath="url(#clip0_138_7471)">
                      <path d="M12.0519 32.1186C11.9028 31.5598 12.1037 31.001 12.4019 30.4948L17.1594 22.2182C17.4122 21.758 17.8594 21.5082 18.3585 21.5082C18.8576 21.5082 19.3113 21.7646 19.5576 22.2182L24.3152 30.4948C24.6133 31.001 24.8143 31.5598 24.6652 32.1186C24.1143 34.4063 21.5086 36.1287 18.3585 36.1287C15.2084 36.1287 12.6028 34.3998 12.0519 32.1186ZM18.3585 24.953L14.7029 31.2508H21.9623L18.3585 24.953ZM31.2311 16.6238H37.6415C38.5424 16.6238 39.2425 17.3338 39.2425 18.2476C39.2425 19.1613 38.5424 19.8713 37.6415 19.8713H31.9311C31.6784 21.1927 30.8293 22.2577 29.6302 22.7639V37.7459H37.6415C38.5424 37.7459 39.2425 38.4559 39.2425 39.3697C39.2425 40.2835 38.5424 40.9934 37.6415 40.9934H18.4104C17.5094 40.9934 16.8094 40.2835 16.8094 39.3697C16.8094 38.4559 17.5094 37.7459 18.4104 37.7459H26.4217V22.7704C25.268 22.2642 24.367 21.1927 24.1207 19.8779H18.4104C17.5094 19.8779 16.8094 19.1679 16.8094 18.2541C16.8094 17.3403 17.5094 16.6304 18.4104 16.6304H24.8208C25.5726 15.664 26.7264 15.0066 28.0227 15.0066C29.319 15.0066 30.4792 15.664 31.2246 16.6304L31.2311 16.6238ZM37.6415 36.1287C34.4849 36.1287 31.8858 34.3998 31.3348 32.1186C31.1858 31.5598 31.3867 31.001 31.6848 30.4948L36.4424 22.2182C36.6952 21.758 37.1424 21.5082 37.6415 21.5082C38.1406 21.5082 38.5943 21.7646 38.8406 22.2182L43.5982 30.4948C43.8963 31.001 44.0972 31.5598 43.9482 32.1186C43.3972 34.4063 40.7916 36.1287 37.6415 36.1287ZM34.0312 31.2508H41.2388L37.635 24.953L34.0312 31.2508Z" fill="#001F4E" />
                    </g>
                    <defs>
                      <clipPath id="clip0_138_7471">
                        <rect width="32" height="26" fill="white" transform="translate(12 15)" />
                      </clipPath>
                    </defs>
                  </svg>
                ) : (
                  <Icon className="h-6 w-6 text-[#D2A047]" strokeWidth={1.5} />
                )}
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
          <h2 className="text-[32px] font-bold uppercase leading-[1.08] tracking-[-0.06em] text-navy sm:text-[40px] lg:text-[48px]">
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
              className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-[4px] bg-[#D2A047] px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90 sm:w-fit"
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
