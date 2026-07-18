import type { ReactNode } from "react";
import type { DocumentosProjeto, Projeto } from "@/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const DOCS_OBRIGATORIOS: (keyof DocumentosProjeto)[] = [
  "matriculaUrl",
  "alvaraUrl",
  "memorialUrl",
  "plantaUrl",
  "viabilidadeUrl",
];

export interface ProgressItem {
  readonly id: string;
  readonly label: string;
  readonly done: boolean;
}

export function getProjetoProgressItems(projeto: Pick<Projeto, "descricao" | "valorCaptar" | "valorTotal" | "prazoObra" | "prazoRetorno" | "rentabilidadeEstimada" | "modeloRetorno" | "planoSaida" | "tipoOferta" | "documentos" | "equipe" | "viabilidade">): ProgressItem[] {
  const docs = projeto.documentos ?? {};
  const financeiroOk =
    projeto.valorCaptar !== undefined &&
    projeto.valorTotal !== undefined &&
    projeto.prazoObra !== undefined &&
    projeto.prazoRetorno !== undefined &&
    projeto.rentabilidadeEstimada !== undefined &&
    projeto.modeloRetorno !== undefined &&
    (projeto.planoSaida?.length ?? 0) > 0 &&
    projeto.tipoOferta !== undefined;

  return [
    { id: "dados", label: "Dados gerais", done: (projeto.descricao?.length ?? 0) >= 200 },
    { id: "financeiro", label: "Dados financeiros", done: financeiroOk },
    { id: "viabilidade", label: "Calculadora de viabilidade", done: projeto.viabilidade !== undefined },
    ...DOCS_OBRIGATORIOS.map((key) => ({
      id: key,
      label: `Doc: ${key.replace(/Url$/, "")}`,
      done: typeof docs[key] === "string" && (docs[key] as string).length > 0,
    })),
    { id: "equipe", label: "Equipe (mín. 1)", done: (projeto.equipe?.length ?? 0) >= 1 },
  ];
}

export function ProjetoProgressBar({ items }: { readonly items: ProgressItem[] }): ReactNode {
  const done = items.filter((i) => i.done).length;
  const pct = items.length === 0 ? 0 : Math.round((done / items.length) * 100);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Progresso do projeto</h3>
        <span className="text-xs font-medium text-muted-foreground">{String(done)}/{String(items.length)} · {String(pct)}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${String(pct)}%` }} />
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-xs">
            <span className={cn(
              "flex h-5 w-5 items-center justify-center border",
              item.done ? "border-status-success bg-status-success-subtle text-status-success" : "border-border text-muted-foreground",
            )}>
              {item.done ? <Check className="h-3 w-3" /> : null}
            </span>
            <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
