import { v4 as uuidv4 } from 'uuid';
import { TESOURARIA_CONTA_ID } from '../core/types/index.js';
import type { SpeConta, FinanceiroAuditoriaEntry } from '../core/types/index.js';
import { ConditionalCheckFailedException } from './index.js';
import {
  getSpeConta,
  putSpeConta,
  putFinanceiroAuditoria,
  updateSpeConta,
} from './financeiro.js';
import {
  createWorkspace,
  projectUsername,
  treasuryUsername,
} from '../starkbank/index.js';

export async function openTreasuryAccount(userId: string, userName: string): Promise<SpeConta> {
  const existing = await getSpeConta(TESOURARIA_CONTA_ID);
  if (existing !== null) return existing;

  const { workspace, pixKey } = await createWorkspace({
    username: treasuryUsername(),
    name: 'Atlas Hub Tesouraria',
  });
  const now = new Date().toISOString();
  const conta: SpeConta = {
    projetoId: TESOURARIA_CONTA_ID,
    tipo: 'TESOURARIA',
    workspaceId: workspace.id,
    username: workspace.username,
    status: workspace.status === 'blocked' ? 'BLOQUEADA' : 'ATIVA',
    projetoNome: 'Tesouraria Atlas',
    criadoEm: now,
    atualizadoEm: now,
    criadoPor: userId,
    ...(pixKey !== undefined ? { pixKey } : {}),
  };
  try {
    await putSpeConta(conta);
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      const raced = await getSpeConta(TESOURARIA_CONTA_ID);
      if (raced !== null) return raced;
    }
    throw err;
  }
  const auditoria: FinanceiroAuditoriaEntry = {
    projetoId: TESOURARIA_CONTA_ID,
    criadoEm: now,
    id: uuidv4(),
    acao: 'CONTA_CRIADA',
    userId,
    userName,
    descricao: 'Workspace de tesouraria Atlas criado',
    workspaceId: workspace.id,
  };
  await putFinanceiroAuditoria(auditoria);
  if (pixKey !== undefined && pixKey.length > 0) {
    await updateSpeConta(TESOURARIA_CONTA_ID, { pixKey });
  }
  return conta;
}

export async function openSpeAccount(params: {
  readonly projetoId: string;
  readonly projetoNome: string;
  readonly cnpjSpe: string;
  readonly razaoSocialSpe: string;
  readonly userId: string;
  readonly userName: string;
}): Promise<SpeConta> {
  const existing = await getSpeConta(params.projetoId);
  if (existing !== null) return existing;

  await openTreasuryAccount(params.userId, params.userName);

  const { workspace, pixKey } = await createWorkspace({
    username: projectUsername(params.projetoId),
    name: params.projetoNome.slice(0, 80),
  });
  const now = new Date().toISOString();
  const conta: SpeConta = {
    projetoId: params.projetoId,
    tipo: 'SPE',
    workspaceId: workspace.id,
    username: workspace.username,
    status: workspace.status === 'blocked' ? 'BLOQUEADA' : 'ATIVA',
    cnpjSpe: params.cnpjSpe,
    razaoSocialSpe: params.razaoSocialSpe,
    projetoNome: params.projetoNome,
    criadoEm: now,
    atualizadoEm: now,
    criadoPor: params.userId,
    ...(pixKey !== undefined ? { pixKey } : {}),
  };
  try {
    await putSpeConta(conta);
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      const raced = await getSpeConta(params.projetoId);
      if (raced !== null) return raced;
    }
    throw err;
  }
  const auditoria: FinanceiroAuditoriaEntry = {
    projetoId: params.projetoId,
    criadoEm: now,
    id: uuidv4(),
    acao: 'CONTA_CRIADA',
    userId: params.userId,
    userName: params.userName,
    descricao: `Workspace SPE criado para ${params.razaoSocialSpe}`,
    workspaceId: workspace.id,
  };
  await putFinanceiroAuditoria(auditoria);
  return conta;
}
