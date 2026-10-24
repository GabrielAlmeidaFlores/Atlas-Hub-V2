import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { ok, badRequest, notFound, serverError, serviceUnavailable } from '../shared/http/response.js';
import {
  validate,
  resetConfirmarSchema,
  ValidationError,
  isValidCnpjDigits,
  isValidCpfDigits,
} from '../shared/http/validators.js';
import { AWS_REGION, COGNITO_USER_POOL_ID } from '../shared/core/env.js';
import { limparReset, resetConfigurado, validarToken } from '../shared/password-reset/service.js';
import { getIncorporadora, putIncorporadora } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';
import type { Incorporadora } from '../shared/core/types/index.js';

const cognito = new CognitoIdentityProviderClient({ region: AWS_REGION });

interface FieldError {
  readonly field: string;
  readonly message: string;
}

function isUserNotFound(err: unknown): boolean {
  return err instanceof Error && err.name === 'UserNotFoundException';
}

function isInvalidPassword(err: unknown): boolean {
  return err instanceof Error && err.name === 'InvalidPasswordException';
}

function validarEmpresa(body: {
  readonly cnpj?: string | undefined;
  readonly razaoSocial?: string | undefined;
  readonly nomeResponsavel?: string | undefined;
  readonly cpfResponsavel?: string | undefined;
  readonly cargoResponsavel?: string | undefined;
  readonly telefone?: string | undefined;
}): { readonly fields: FieldError[]; readonly dados: {
  readonly cnpj: string;
  readonly razaoSocial: string;
  readonly nomeResponsavel: string;
  readonly cpfResponsavel: string;
  readonly cargoResponsavel: string;
  readonly telefone: string;
} } {
  const cnpj = (body.cnpj ?? '').replace(/\D/g, '');
  const razaoSocial = (body.razaoSocial ?? '').trim();
  const nomeResponsavel = (body.nomeResponsavel ?? '').trim();
  const cpfResponsavel = (body.cpfResponsavel ?? '').replace(/\D/g, '');
  const cargoResponsavel = (body.cargoResponsavel ?? '').trim();
  const telefone = (body.telefone ?? '').replace(/\D/g, '');

  const fields: FieldError[] = [];
  if (!isValidCnpjDigits(cnpj)) fields.push({ field: 'cnpj', message: 'CNPJ inválido' });
  if (razaoSocial.length < 2) fields.push({ field: 'razaoSocial', message: 'Informe a razão social' });
  if (nomeResponsavel.length < 2) fields.push({ field: 'nomeResponsavel', message: 'Informe o nome do responsável' });
  if (!isValidCpfDigits(cpfResponsavel)) fields.push({ field: 'cpfResponsavel', message: 'CPF do responsável inválido' });
  if (cargoResponsavel.length < 2) fields.push({ field: 'cargoResponsavel', message: 'Informe o cargo do responsável' });
  if (telefone.length < 10) fields.push({ field: 'telefone', message: 'Telefone inválido' });

  return {
    fields,
    dados: { cnpj, razaoSocial, nomeResponsavel, cpfResponsavel, cargoResponsavel, telefone },
  };
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('publicoResetConfirmar');
  try {
    if (COGNITO_USER_POOL_ID === '' || !resetConfigurado()) {
      return serviceUnavailable(event, 'Recuperação de senha indisponível');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(event.body ?? '{}');
    } catch {
      return badRequest(event, 'JSON inválido');
    }
    const body = validate(resetConfirmarSchema, parsed);

    const tokenOk = await validarToken(body.email, body.resetToken);
    if (!tokenOk) {
      return badRequest(event, 'Sessão expirada. Solicite um novo código.', 'VALIDATION_ERROR');
    }

    let user;
    try {
      user = await cognito.send(new AdminGetUserCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: body.email,
      }));
    } catch (err) {
      if (isUserNotFound(err)) return notFound(event, 'Conta não encontrada');
      throw err;
    }

    const username = user.Username ?? body.email;
    const email = user.UserAttributes?.find((item) => item.Name === 'email')?.Value ?? body.email;
    const tipoExistente = user.UserAttributes?.find((item) => item.Name === 'custom:tipo')?.Value ?? '';
    const tipo = tipoExistente !== '' ? tipoExistente : body.tipo;

    if (tipo !== 'investidor' && tipo !== 'incorporadora') {
      return badRequest(event, 'Informe o tipo de conta', 'VALIDATION_ERROR', [
        { field: 'tipo', message: 'Informe se a conta é de investidor ou incorporadora' },
      ]);
    }

    if (tipo === 'incorporadora') {
      const existente = await getIncorporadora(username);
      const precisaEmpresa = tipoExistente === '' || existente === null;
      if (precisaEmpresa) {
        const validacao = validarEmpresa(body);
        if (validacao.fields.length > 0) {
          return badRequest(event, 'Complete os dados da empresa', 'VALIDATION_ERROR', validacao.fields);
        }
        const dados = validacao.dados;
        const agora = new Date().toISOString();
        const registro: Incorporadora = {
          ...(existente ?? { id: username, criadoEm: agora }),
          cnpj: dados.cnpj,
          razaoSocial: dados.razaoSocial,
          nomeResponsavel: dados.nomeResponsavel,
          cpfResponsavel: dados.cpfResponsavel,
          cargoResponsavel: dados.cargoResponsavel,
          email,
          telefone: dados.telefone,
          emailConfirmado: true,
          atualizadoEm: agora,
        };
        await putIncorporadora(registro);
      }
    }

    await cognito.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: username,
      UserAttributes: [
        { Name: 'email_verified', Value: 'true' },
        { Name: 'custom:tipo', Value: tipo },
      ],
    }));

    await cognito.send(new AdminAddUserToGroupCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: username,
      GroupName: tipo === 'investidor' ? 'INVESTIDOR' : 'INCORPORADORA',
    }));

    await cognito.send(new AdminSetUserPasswordCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: username,
      Password: body.newPassword,
      Permanent: true,
    }));

    await limparReset(body.email);
    log.info('Senha redefinida e conta ativada', { tipo });

    return ok(event, { ok: true, tipo });
  } catch (err) {
    if (err instanceof ValidationError) {
      return badRequest(event, err.message, 'VALIDATION_ERROR', err.fields);
    }
    if (isInvalidPassword(err)) {
      return badRequest(event, 'Senha inválida', 'VALIDATION_ERROR', [
        { field: 'newPassword', message: 'Use no mínimo 8 caracteres, com ao menos 1 número' },
      ]);
    }
    if (isUserNotFound(err)) return notFound(event, 'Conta não encontrada');
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
