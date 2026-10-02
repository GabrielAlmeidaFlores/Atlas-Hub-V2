import { EMAIL_FROM, RESEND_API_KEY } from '../core/env.js';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

interface EmailParams {
  readonly to: string;
  readonly subject: string;
  readonly htmlBody: string;
  readonly textBody?: string;
}

function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1b2b5e">
    <div style="max-width:560px;margin:0 auto;padding:24px">
      <div style="padding:16px 0;font-size:18px;font-weight:700;color:#1b2b5e">Atlas Hub</div>
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:24px">
        <h2 style="margin:0 0 16px;font-size:18px;color:#1b2b5e">${title}</h2>
        ${body}
      </div>
      <p style="margin:16px 0 0;font-size:12px;color:#6b7280">
        Atlas Hub · plataforma de originação e curadoria de projetos imobiliários
      </p>
    </div>
  </body>
</html>`;
}

export async function sendEmail(params: EmailParams): Promise<void> {
  if (RESEND_API_KEY.length === 0) throw new Error('RESEND_API_KEY não configurada');
  if (params.to.trim().length === 0) throw new Error('Destinatário de e-mail vazio');

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Atlas Hub <${EMAIL_FROM}>`,
      to: [params.to],
      subject: params.subject,
      html: params.htmlBody,
      ...(params.textBody !== undefined ? { text: params.textBody } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend falhou (${String(res.status)}): ${detail}`);
  }
}

export function emailBoasVindas(to: string, nome: string): Promise<void> {
  return sendEmail({
    to,
    subject: 'Bem-vindo à Atlas Hub',
    htmlBody: layout(
      'Bem-vindo à Atlas Hub',
      `<p>Olá, ${nome}.</p>
       <p>Sua conta foi confirmada. Agora você já pode acessar o portal da incorporadora,
       cadastrar seus projetos e acompanhar a análise da curadoria.</p>
       <p>Acesse <a href="https://d3vqf6k21x668r.amplifyapp.com/dashboard">o seu painel</a> para começar.</p>`,
    ),
  });
}

export function emailProjetoSubmetido(to: string, nomeProjeto: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Projeto recebido: ${nomeProjeto} — Atlas Hub`,
    htmlBody: layout(
      'Projeto recebido',
      `<p>Seu projeto <strong>${nomeProjeto}</strong> foi recebido pela equipe Atlas Hub e está aguardando análise.</p>
       <p>Você será notificado quando o analista iniciar a revisão.</p>`,
    ),
  });
}

export function emailAjusteSolicitado(to: string, nomeProjeto: string, textoAjuste: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Ajuste necessário: ${nomeProjeto} — Atlas Hub`,
    htmlBody: layout(
      'Ajuste solicitado',
      `<p>O analista identificou pendências no projeto <strong>${nomeProjeto}</strong>:</p>
       <blockquote style="margin:12px 0;padding:8px 12px;border-left:3px solid #c49020;color:#374151">${textoAjuste}</blockquote>
       <p>Acesse a plataforma para realizar os ajustes e resubmeter o projeto.</p>`,
    ),
  });
}

export function emailReprovado(to: string, nomeProjeto: string, justificativa: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Projeto reprovado: ${nomeProjeto} — Atlas Hub`,
    htmlBody: layout(
      'Projeto reprovado',
      `<p>Após análise, o projeto <strong>${nomeProjeto}</strong> foi reprovado.</p>
       <p><strong>Justificativa:</strong></p>
       <blockquote style="margin:12px 0;padding:8px 12px;border-left:3px solid #c49020;color:#374151">${justificativa}</blockquote>
       <p>Você pode corrigir os pontos indicados e resubmeter o projeto.</p>`,
    ),
  });
}

export function emailAprovado(to: string, nomeProjeto: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Projeto aprovado: ${nomeProjeto} — Atlas Hub`,
    htmlBody: layout(
      'Parabéns, projeto aprovado',
      `<p>O projeto <strong>${nomeProjeto}</strong> foi aprovado pela curadoria da Atlas Hub.</p>
       <p>Nossa equipe está criando a oferta de investimento. Em breve você receberá o link para compartilhar com investidores.</p>`,
    ),
  });
}

export function emailOfertaCriada(to: string, nomeProjeto: string, ofertaLink: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Oferta publicada: ${nomeProjeto} — Atlas Hub`,
    htmlBody: layout(
      'Sua oferta está no ar',
      `<p>A oferta do projeto <strong>${nomeProjeto}</strong> foi publicada e já está disponível para investidores.</p>
       <p><a href="${ofertaLink}" style="color:#1b2b5e;font-weight:600">Acessar oferta</a></p>`,
    ),
  });
}
