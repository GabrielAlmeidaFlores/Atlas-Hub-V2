import type { Notificacao } from "@/types";

export function destinoNotificacao(n: Pick<Notificacao, "tipo" | "projetoId">): string | undefined {
  if (n.projetoId === undefined || n.projetoId === "") return undefined;
  if (
    n.tipo === "CARTAO_HABILITADO"
    || n.tipo === "CARTAO_LIBERACAO_CONFIRMADA"
    || n.tipo === "CARTAO_LIBERACAO_REJEITADA"
  ) {
    return `/projetos/${n.projetoId}/cronograma`;
  }
  return `/projetos/${n.projetoId}`;
}
