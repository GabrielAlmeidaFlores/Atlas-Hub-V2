import { type ReactNode } from "react";
import { Lightbulb } from "lucide-react";

const EXEMPLOS = [
  {
    categoria: "Construção para Venda",
    itens: ["Casas, apartamentos, kitnets"],
  },
  {
    categoria: "Construção de Barracão",
    itens: ["Barracão para aluguel"],
  },
  {
    categoria: "Construção para Aluguel",
    itens: ["Casas ou apartamentos"],
  },
  {
    categoria: "Construção para Aluguel de Curta Temporada",
    itens: ["Airbnb, temporada"],
  },
  {
    categoria: "Hospedagem",
    itens: ["Hotel", "Pousada", "Studios", "Resort"],
  },
  {
    categoria: "House Flip",
    itens: ["Compra, reforma e revenda"],
  },
  {
    categoria: "Compra para Locação com Gestão",
    itens: ["Imóvel pronto para alugar"],
  },
  {
    categoria: "Compra para Locação de Curta Temporada",
    itens: ["Imóvel pronto com gestão"],
  },
  {
    categoria: "Licitações",
    itens: ["Obras públicas"],
  },
];

export function TipoProjetoExemplos(): ReactNode {
  return (
    <div className="rounded-lg border border-[#D2A047]/20 bg-[#FFF9EB] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-[#D2A047]" strokeWidth={2} />
        <h3 className="text-sm font-semibold text-[#6C4C14]">Exemplos de Tipos de Projetos</h3>
      </div>
      <div className="grid gap-2 text-xs">
        {EXEMPLOS.map(({ categoria, itens }) => (
          <div key={categoria} className="flex gap-2">
            <span className="font-medium text-[#6C4C14]">{categoria}:</span>
            <span className="text-[#6C4C14]/80">{itens.join(", ")}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs italic text-[#6C4C14]/70">
        Inspire-se nesses exemplos para criar seu projeto
      </p>
    </div>
  );
}
