import type { SituacaoOrcamento, StatusEtapaObra } from "@/types";

export const STATUS_ETAPA_LABEL: Record<StatusEtapaObra, string> = {
  PLANEJADA: "Planejada",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  ATRASADA: "Atrasada",
};

export const SITUACAO_LABEL: Record<SituacaoOrcamento, string> = {
  SEM_LANCAMENTO: "Sem lançamento",
  DENTRO: "Dentro do orçamento",
  ESTOURO: "Estouro",
};

export function statusEtapaClass(status: StatusEtapaObra): string {
  if (status === "CONCLUIDA") return "badge badge-aprovado";
  if (status === "ATRASADA") return "badge badge-reprovado";
  if (status === "EM_ANDAMENTO") return "badge badge-analise";
  return "badge badge-submetido";
}

export function situacaoClass(situacao: SituacaoOrcamento): string {
  if (situacao === "ESTOURO") return "badge badge-reprovado";
  if (situacao === "DENTRO") return "badge badge-aprovado";
  return "badge badge-submetido";
}

export function formatDateYmd(ymd: string | undefined): string {
  if (ymd === undefined || ymd.length < 10) return "—";
  const [y, m, d] = ymd.slice(0, 10).split("-");
  if (y === undefined || m === undefined || d === undefined) return "—";
  return `${d}/${m}/${y}`;
}

export function formatDesvioDias(dias: number): string {
  if (dias === 0) return "No prazo";
  if (dias > 0) return `+${String(dias)} dia${dias === 1 ? "" : "s"}`;
  return `${String(dias)} dia${dias === -1 ? "" : "s"}`;
}
