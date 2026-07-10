import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { AWS_REGION, SES_FROM_EMAIL } from '../core/env.js';

const ses = new SESClient({ region: AWS_REGION });

interface EmailParams {
  readonly to: string;
  readonly subject: string;
  readonly htmlBody: string;
  readonly textBody?: string;
}

/** Sends a transactional email via SES. */
export async function sendEmail(params: EmailParams): Promise<void> {
  await ses.send(new SendEmailCommand({
    Source: `Atlas Hub <${SES_FROM_EMAIL}>`,
    Destination: { ToAddresses: [params.to] },
    Message: {
      Subject: { Data: params.subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: params.htmlBody, Charset: 'UTF-8' },
        ...(params.textBody !== undefined && {
          Text: { Data: params.textBody, Charset: 'UTF-8' },
        }),
      },
    },
  }));
}

export function emailProjetoSubmetido(to: string, nomeProjeto: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Projeto recebido: ${nomeProjeto} — Atlas Hub`,
    htmlBody: `
      <h2>Projeto recebido com sucesso!</h2>
      <p>Seu projeto <strong>${nomeProjeto}</strong> foi recebido pela equipe Atlas Hub e está aguardando análise.</p>
      <p>Você será notificado quando o analista iniciar a revisão.</p>
    `,
  });
}

export function emailAjusteSolicitado(to: string, nomeProjeto: string, textoAjuste: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Ajuste necessário: ${nomeProjeto} — Atlas Hub`,
    htmlBody: `
      <h2>Ajuste solicitado</h2>
      <p>O analista identificou pendências no projeto <strong>${nomeProjeto}</strong>:</p>
      <blockquote>${textoAjuste}</blockquote>
      <p>Acesse a plataforma para realizar os ajustes e resubmeter o projeto.</p>
    `,
  });
}

export function emailReprovado(to: string, nomeProjeto: string, justificativa: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Projeto reprovado: ${nomeProjeto} — Atlas Hub`,
    htmlBody: `
      <h2>Projeto reprovado</h2>
      <p>Após análise, o projeto <strong>${nomeProjeto}</strong> foi reprovado.</p>
      <p><strong>Justificativa:</strong></p>
      <blockquote>${justificativa}</blockquote>
      <p>Você pode corrigir os pontos indicados e resubmeter o projeto.</p>
    `,
  });
}

export function emailAprovado(to: string, nomeProjeto: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Projeto aprovado: ${nomeProjeto} — Atlas Hub`,
    htmlBody: `
      <h2>Parabéns! Projeto aprovado.</h2>
      <p>O projeto <strong>${nomeProjeto}</strong> foi aprovado pela curadoria da Atlas Hub.</p>
      <p>Nossa equipe está criando a oferta de investimento. Em breve você receberá o link para compartilhar com investidores.</p>
    `,
  });
}

export function emailOfertaCriada(to: string, nomeProjeto: string, ofertaLink: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Oferta publicada: ${nomeProjeto} — Atlas Hub`,
    htmlBody: `
      <h2>Sua oferta está no ar!</h2>
      <p>A oferta do projeto <strong>${nomeProjeto}</strong> foi publicada e já está disponível para investidores.</p>
      <p><a href="${ofertaLink}">Acessar oferta</a></p>
    `,
  });
}
