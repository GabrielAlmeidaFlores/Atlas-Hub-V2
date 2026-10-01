import { v4 as uuidv4 } from 'uuid';
import type { Notificacao, Projeto } from '../core/types/index.js';
import { putNotificacao } from '../db/index.js';

export async function notificarIncorporadoraCartao(
  projeto: Projeto | null,
  tipo: Extract<Notificacao['tipo'], 'CARTAO_HABILITADO' | 'CARTAO_LIBERACAO_CONFIRMADA' | 'CARTAO_LIBERACAO_REJEITADA'>,
  titulo: string,
  mensagem: string,
): Promise<void> {
  if (projeto === null) return;
  const now = new Date().toISOString();
  await putNotificacao({
    userId: projeto.incorporadoraId,
    criadoEm: now,
    id: uuidv4(),
    tipo,
    titulo,
    mensagem,
    lida: false,
    projetoId: projeto.id,
    projetoNome: projeto.nome,
    ttl: Math.floor(Date.now() / 1000) + 7_776_000,
  });
}
