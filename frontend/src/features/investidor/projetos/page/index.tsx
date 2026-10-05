import { type ReactNode } from "react";
import { ProjetosAtlas } from "@/features/landing/components/projetos-atlas";

export default function InvestidorProjetosPage(): ReactNode {
  return (
    <ProjetosAtlas
      titleSuffix=" disponíveis para investimento"
      titleHighlightClassName="text-[#6C4C14]"
      titleSuffixClassName="text-[#6C4C14]"
      ctaLabel="Investir"
      paginatedGrid
      projectsPerPage={12}
    />
  );
}
