import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { created, unauthorized, forbidden, badRequest, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdminMaster } from '../shared/http/auth.js';
import { validate, ValidationError } from '../shared/http/validators.js';
import { createLogger } from '../shared/core/logger.js';
import { getSpeConta } from '../shared/db/financeiro.js';
import { createSplitReceiverPrep } from '../shared/starkbank/index.js';
import { z } from 'zod';

const criarSplitSchema = z.object({
  projetoId: z.string().min(1).max(80),
  name: z.string().min(2).max(200),
  taxId: z.string().regex(/^\d{11}$|^\d{14}$/, 'CPF ou CNPJ inválido'),
  pixKey: z.string().min(8).max(80).optional(),
  bankCode: z.string().min(3).max(8).optional(),
  branchCode: z.string().min(1).max(10).optional(),
  accountNumber: z.string().min(2).max(20).optional(),
  accountType: z.enum(['checking', 'savings', 'salary', 'payment']).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
}).superRefine((data, ctx) => {
  const hasPix = data.pixKey !== undefined && data.pixKey.length > 0;
  const hasConta = data.bankCode !== undefined && data.branchCode !== undefined && data.accountNumber !== undefined;
  if (!hasPix && !hasConta) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Informe a chave Pix ou os dados da conta' });
  }
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminFinanceiroSplitCriar');
  try {
    const adminId = getUserId(event);
    requireAdminMaster(event);

    const body = validate(criarSplitSchema, JSON.parse(event.body ?? '{}'));

    const conta = await getSpeConta(body.projetoId);
    if (conta === null) {
      return badRequest(event, 'Conta SPE não encontrada');
    }
    if (conta.status !== 'ATIVA') {
      return badRequest(event, 'Conta não está ativa');
    }

    const destino = {
      name: body.name,
      taxId: body.taxId.replace(/\D/g, ''),
      ...(body.pixKey !== undefined ? { pixKey: body.pixKey } : {}),
      bankCode: body.bankCode ?? '00000000',
      branchCode: body.branchCode ?? '0001',
      accountNumber: body.accountNumber ?? '0000000-0',
      accountType: (body.accountType ?? 'checking') as 'checking' | 'savings' | 'salary' | 'payment',
    };

    const tags = [
      `projeto:${body.projetoId}`,
      `admin:${adminId}`,
      ...(body.tags ?? []),
    ];

    const receiverId = await createSplitReceiverPrep(conta.workspaceId, destino, tags);

    log.info('Split receiver created', { projetoId: body.projetoId, receiverId, adminId });
    return created(event, {
      receiverId,
      projetoId: body.projetoId,
      name: body.name,
      taxId: destino.taxId,
    });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
