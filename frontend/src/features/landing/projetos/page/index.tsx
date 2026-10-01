import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Home, Building2, Warehouse, Calendar, Hotel, Hammer, Key, FileText } from "lucide-react";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { ProjetosAtlas } from "@/features/landing/components/projetos-atlas";
import { useLandingAnalytics } from "@/lib/analytics/use-landing-analytics";

function ProjetosHero(): ReactNode {
  const heroColor = "#001F4E";

  return (
    <section
      className="relative overflow-visible bg-gradient-to-b from-[#D1D1D6] via-[#E7E7EA] via-40% to-white to-65% px-4 pb-[40px] pt-5 sm:px-6 lg:px-8"
      data-analytics-section="hero"
    >
      <div className="relative overflow-hidden rounded-[14px] bg-[#001F4E] shadow-[0_10px_30px_rgba(7,17,34,0.18)]">
        <div className="relative min-h-[676px] overflow-hidden sm:hidden">
          <img
            src="/bg-projetos-mobile.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${heroColor} 0%, ${heroColor} 34%, ${heroColor}f2 42%, ${heroColor}d9 50%, ${heroColor}b3 58%, ${heroColor}80 66%, ${heroColor}4d 74%, ${heroColor}26 82%, transparent 92%)`,
            }}
            aria-hidden
          />
          <div className="relative z-10 px-6 pb-12 pt-8 text-left text-white">
            <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#D2A047]">
              Projetos
            </p>
            <h1 className="text-[30px] font-extrabold uppercase leading-[1.12] tracking-[0.04em]">
              CONHEÇA OS PROJETOS
              <br />
              EM CAPTAÇÃO
            </h1>
            <p className="mt-5 text-[17px] font-medium leading-snug tracking-[-0.04em] text-[#D2A047]">
              Todos os projetos listados passam pela curadoria técnica da Atlas Hub antes de chegar até você.
            </p>
            <Link
              to="/para-investidores"
              data-analytics-cta="projetos_hero_investir"
              className="mt-8 flex h-12 w-full items-center justify-center rounded-[4px] bg-[#D2A047] px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
            >
              Quero Investir
            </Link>
          </div>
        </div>

        <img
          src="/bg-projetos.png"
          alt=""
          className="absolute inset-0 hidden h-full w-full object-cover object-center sm:block"
        />
        <div className="lp-container relative hidden min-h-[480px] items-center py-3 sm:flex lg:min-h-[600px] lg:py-4">
          <div className="relative z-10 max-w-[680px]">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#D2A047]">
              Projetos
            </p>
            <h1 className="text-[32px] font-extrabold uppercase leading-[1.08] tracking-[0.04em] text-white md:text-[38px] lg:text-[44px]">
              Conheça os projetos
              <br />
              em captação
            </h1>
            <p className="mt-5 text-[22px] font-medium leading-relaxed tracking-[-0.03em] text-[#D2A047]">
              Todos os projetos listados passam pela curadoria técnica da Atlas Hub antes de chegar até você.
            </p>
            <Link
              to="/para-investidores"
              data-analytics-cta="projetos_hero_investir"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-[4px] bg-[#D2A047] px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
            >
              Quero Investir
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExemplosProjetos(): ReactNode {
  const exemplos = [
    {
      titulo: "Construção para Venda",
      descricao: "Casas, apartamentos e kitnets para venda.",
      Icon: Home,
    },
    {
      titulo: "Construção para Locação",
      descricao: "Casas e apartamentos desenvolvidos para gerar renda com aluguel.",
      Icon: Building2,
    },
    {
      titulo: "Construção de Barracão",
      descricao: "Barracões e galpões construídos para locação.",
      Icon: Warehouse,
    },
    {
      titulo: "Aluguel de Curta Temporada",
      descricao: "Imóveis para Airbnb, temporada e hospedagem por períodos curtos.",
      Icon: Calendar,
    },
    {
      titulo: "Hospedagem",
      descricao: "Hotéis, pousadas, studios, resorts e outros empreendimentos de hospedagem.",
      Icon: Hotel,
    },
    {
      titulo: "House Flip",
      descricao: "Compra, reforma e revenda de imóveis com foco na valorização e geração de lucro.",
      Icon: Hammer,
    },
    {
      titulo: "Compra para Locação",
      descricao: "Aquisição de imóveis para gerar renda recorrente com aluguel. Opções para locação tradicional ou de curta temporada, com gestão do imóvel.",
      Icon: Key,
    },
    {
      titulo: "Licitações",
      descricao: "Obras e projetos vinculados a contratos e licitações públicas.",
      Icon: FileText,
    },
  ];

  return (
    <section className="bg-white py-12 sm:py-16 lg:py-20">
      <div className="lp-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[#D2A047]">
            Tipos de Projetos
          </p>
          <h2 className="mt-3 text-2xl font-extrabold uppercase tracking-tight text-navy sm:text-3xl">
            Encontre o projeto que combina com sua estratégia
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Explore diferentes modelos de projetos imobiliários para encontrar oportunidades que façam sentido para seus objetivos — ou inspire-se para apresentar seu próprio projeto na Atlas Hub.
          </p>
        </div>
        
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {exemplos.map(({ titulo, descricao, Icon }) => (
            <div
              key={titulo}
              className="flex h-full min-h-[160px] flex-col rounded-[16px] border-2 border-[#6C4C14] bg-transparent p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center">
                <Icon className="h-5 w-5 text-[#D2A047]" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-tight text-[#6C4C14]">
                {titulo}
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#6C4C14]/80">
                {descricao}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ProjetosPage(): ReactNode {
  useLandingAnalytics(true);
  return (
    <MarketingShell>
      <ProjetosHero />
      <ExemplosProjetos />
      <ProjetosAtlas
        sectionClassName="max-sm:px-4 max-sm:pt-0"
        shellClassName="!bg-[#B89048] max-sm:![background-image:url('/projetos-mobile-sessao.png')] sm:![background-image:url('/projetos-sessao.svg')] max-sm:!bg-[length:100%_auto] sm:bg-[length:100%_auto] bg-bottom bg-no-repeat max-sm:!rounded-[14px] max-sm:!mx-0 max-sm:shadow-[0_10px_30px_rgba(7,17,34,0.18)]"
        titleSuffix=" disponíveis"
        titleHighlightClassName="text-[#6C4C14]"
        titleSuffixClassName="text-[#6C4C14]"
        ctaClassName="!bg-[#001F4E] group-hover:!bg-[#001a40] !shadow-none group-hover:!shadow-[0_4px_14px_rgba(0,31,78,0.28)]"
        ctaLabel="Ver projeto"
        projectNameClassName="text-[#001F4E]"
        paginatedGrid
        projectsPerPage={12}
        mobileSingleCarousel
      />
    </MarketingShell>
  );
}
