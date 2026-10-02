import { APP_URL, EMAIL_FROM, RESEND_API_KEY } from '../core/env.js';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const LOGO_URL = `${APP_URL}/atlas-logo.png`;
const NAVY = '#1B2B5E';
const NAVY_DARK = '#0f1a3a';
const GOLD = '#C49020';

interface EmailParams {
  readonly to: string;
  readonly subject: string;
  readonly htmlBody: string;
  readonly textBody?: string;
}

interface LayoutOptions {
  readonly title: string;
  readonly body: string;
  readonly cta?: { readonly label: string; readonly url: string };
}

function layout({ title, body, cta }: LayoutOptions): string {
  const button = cta !== undefined
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 4px">
         <tr>
           <td style="background:${NAVY};border-radius:6px">
             <a href="${cta.url}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;letter-spacing:.2px;color:#ffffff;text-decoration:none">${cta.label}</a>
           </td>
         </tr>
       </table>`
    : '';

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light">
  </head>
  <body style="margin:0;padding:0;background:#eef1f6;font-family:Poppins,Arial,Helvetica,sans-serif;color:${NAVY}">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${title} · Atlas Hub</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f6">
      <tr>
        <td align="center" style="padding:36px 14px">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(15,26,58,.10)">
            <tr><td style="height:6px;background:${NAVY}"></td></tr>
            <tr>
              <td align="center" style="padding:36px 40px 0">
                <img src="${LOGO_URL}" alt="Atlas Hub" height="32" style="display:block;height:32px;border:0">
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 40px 0">
                <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="height:3px;width:56px;background:${GOLD};border-radius:3px;font-size:0;line-height:0">&nbsp;</td></tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 40px 40px">
                <h1 style="margin:0 0 16px;font-size:21px;line-height:1.32;font-weight:700;color:${NAVY}">${title}</h1>
                <div style="font-size:15px;line-height:1.7;color:#4b5563">${body}</div>
                ${button}
              </td>
            </tr>
            <tr>
              <td align="center" style="background:${NAVY_DARK};padding:30px 40px">
                <p style="margin:0;font-size:13px;font-weight:600;color:${GOLD}">Construa sem banco. Capte com investidores.</p>
                <p style="margin:10px 0 0;font-size:11px;line-height:1.5;color:rgba(255,255,255,.55)">
                  © 2026 Atlas Hub · Conectando Capital ao Mercado Imobiliário
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
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
    htmlBody: layout({
      title: 'Bem-vindo à Atlas Hub',
      body: `<p style="margin:0 0 12px">Olá, ${nome}.</p>
             <p style="margin:0">Sua conta foi confirmada. Agora você já pode cadastrar seus projetos,
             montar o cronograma da obra e acompanhar a análise da curadoria em tempo real.</p>`,
      cta: { label: 'Acessar meu painel', url: `${APP_URL}/dashboard` },
    }),
  });
}

export function emailProjetoSubmetido(to: string, nomeProjeto: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Projeto recebido: ${nomeProjeto}`,
    htmlBody: layout({
      title: 'Projeto recebido',
      body: `<p style="margin:0 0 12px">Recebemos o projeto <strong style="color:${NAVY}">${nomeProjeto}</strong> e ele já está na fila da nossa curadoria.</p>
             <p style="margin:0">Você será avisado assim que um analista iniciar a revisão.</p>`,
      cta: { label: 'Acompanhar projeto', url: `${APP_URL}/dashboard` },
    }),
  });
}

export function emailAjusteSolicitado(to: string, nomeProjeto: string, textoAjuste: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Ajuste necessário: ${nomeProjeto}`,
    htmlBody: layout({
      title: 'Ajuste solicitado',
      body: `<p style="margin:0 0 12px">O analista identificou pendências no projeto <strong style="color:${NAVY}">${nomeProjeto}</strong>:</p>
             <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid ${GOLD};background:#faf7ef;color:#374151;border-radius:0 6px 6px 0">${textoAjuste}</blockquote>
             <p style="margin:0">Acesse a plataforma, faça os ajustes e resubmeta o projeto para uma nova análise.</p>`,
      cta: { label: 'Revisar e resubmeter', url: `${APP_URL}/dashboard` },
    }),
  });
}

export function emailReprovado(to: string, nomeProjeto: string, justificativa: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Projeto reprovado: ${nomeProjeto}`,
    htmlBody: layout({
      title: 'Projeto reprovado',
      body: `<p style="margin:0 0 12px">Após análise, o projeto <strong style="color:${NAVY}">${nomeProjeto}</strong> foi reprovado.</p>
             <p style="margin:0 0 6px"><strong style="color:${NAVY}">Justificativa</strong></p>
             <blockquote style="margin:0 0 12px;padding:12px 16px;border-left:3px solid ${GOLD};background:#faf7ef;color:#374151;border-radius:0 6px 6px 0">${justificativa}</blockquote>
             <p style="margin:0">Você pode corrigir os pontos indicados e resubmeter o projeto sem limite de tentativas.</p>`,
      cta: { label: 'Revisar projeto', url: `${APP_URL}/dashboard` },
    }),
  });
}

export function emailAprovado(to: string, nomeProjeto: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Projeto aprovado: ${nomeProjeto}`,
    htmlBody: layout({
      title: 'Parabéns, projeto aprovado',
      body: `<p style="margin:0 0 12px">O projeto <strong style="color:${NAVY}">${nomeProjeto}</strong> foi aprovado pela curadoria da Atlas Hub.</p>
             <p style="margin:0">Nossa equipe já está preparando a oferta de investimento. Em breve você receberá o link para compartilhar com investidores.</p>`,
      cta: { label: 'Acompanhar', url: `${APP_URL}/dashboard` },
    }),
  });
}

export function emailOfertaCriada(to: string, nomeProjeto: string, ofertaLink: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Oferta publicada: ${nomeProjeto}`,
    htmlBody: layout({
      title: 'Sua oferta está no ar',
      body: `<p style="margin:0 0 12px">A oferta do projeto <strong style="color:${NAVY}">${nomeProjeto}</strong> foi publicada e já está disponível para investidores.</p>
             <p style="margin:0">Compartilhe o link com a sua rede e acompanhe o progresso da captação.</p>`,
      cta: { label: 'Acessar oferta', url: ofertaLink },
    }),
  });
}
