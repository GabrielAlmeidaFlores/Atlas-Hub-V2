import { APP_URL, EMAIL_FROM, RESEND_API_KEY } from '../core/env.js';
import base from './templates/base.html';
import boasVindasTpl from './templates/boas-vindas.html';
import projetoRecebidoTpl from './templates/projeto-recebido.html';
import ajusteTpl from './templates/ajuste-solicitado.html';
import reprovadoTpl from './templates/reprovado.html';
import aprovadoTpl from './templates/aprovado.html';
import ofertaTpl from './templates/oferta-criada.html';
import novoAcessoTpl from './templates/novo-acesso.html';
import codigoTpl from './templates/codigo.html';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const LOGO_URL = `${APP_URL}/atlas-logo.png`;

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => vars[key] ?? '');
}

function ctaBlock(cta?: { readonly label: string; readonly url: string }): string {
  if (cta === undefined) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0 0">
         <tr>
           <td style="background:#D2A047;border-radius:8px">
             <a href="${cta.url}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:Roboto,Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;letter-spacing:.02em;color:#ffffff;text-decoration:none">${cta.label}</a>
           </td>
         </tr>
       </table>`;
}

function renderEmail(
  contentTpl: string,
  title: string,
  vars: Record<string, string>,
  cta?: { readonly label: string; readonly url: string },
): string {
  return fill(base, {
    ...vars,
    title,
    preheader: title,
    content: fill(contentTpl, vars),
    ctaBlock: ctaBlock(cta),
    logoUrl: LOGO_URL,
    year: String(new Date().getFullYear()),
    appUrl: APP_URL,
  });
}

interface EmailParams {
  readonly to: string;
  readonly subject: string;
  readonly htmlBody: string;
  readonly textBody?: string;
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
    htmlBody: renderEmail(boasVindasTpl, 'Bem-vindo à Atlas Hub', { nome }, {
      label: 'Acessar meu painel',
      url: `${APP_URL}/dashboard`,
    }),
  });
}

export function emailProjetoSubmetido(to: string, nomeProjeto: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Projeto recebido: ${nomeProjeto}`,
    htmlBody: renderEmail(projetoRecebidoTpl, 'Projeto recebido', { nomeProjeto }, {
      label: 'Acompanhar projeto',
      url: `${APP_URL}/dashboard`,
    }),
  });
}

export function emailAjusteSolicitado(to: string, nomeProjeto: string, textoAjuste: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Ajuste necessário: ${nomeProjeto}`,
    htmlBody: renderEmail(ajusteTpl, 'Ajuste solicitado', { nomeProjeto, textoAjuste }, {
      label: 'Revisar e resubmeter',
      url: `${APP_URL}/dashboard`,
    }),
  });
}

export function emailReprovado(to: string, nomeProjeto: string, justificativa: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Projeto reprovado: ${nomeProjeto}`,
    htmlBody: renderEmail(reprovadoTpl, 'Projeto reprovado', { nomeProjeto, justificativa }, {
      label: 'Revisar projeto',
      url: `${APP_URL}/dashboard`,
    }),
  });
}

export function emailAprovado(to: string, nomeProjeto: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Projeto aprovado: ${nomeProjeto}`,
    htmlBody: renderEmail(aprovadoTpl, 'Parabéns, projeto aprovado', { nomeProjeto }, {
      label: 'Acompanhar',
      url: `${APP_URL}/dashboard`,
    }),
  });
}

export function emailOfertaCriada(to: string, nomeProjeto: string, ofertaLink: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Oferta publicada: ${nomeProjeto}`,
    htmlBody: renderEmail(ofertaTpl, 'Sua oferta está no ar', { nomeProjeto }, {
      label: 'Acessar oferta',
      url: ofertaLink.length > 0 ? ofertaLink : APP_URL,
    }),
  });
}

export function emailNovoAcesso(to: string, quando: string, dispositivo: string): Promise<void> {
  return sendEmail({
    to,
    subject: 'Novo acesso à sua conta Atlas Hub',
    htmlBody: renderEmail(novoAcessoTpl, 'Novo acesso detectado', { quando, dispositivo }, {
      label: 'Fui eu, tudo certo',
      url: `${APP_URL}/dashboard`,
    }),
  });
}

export function emailCodigo(to: string, codigo: string, opts: { readonly titulo: string; readonly texto: string }): Promise<void> {
  return sendEmail({
    to,
    subject: `${opts.titulo} · Atlas Hub`,
    htmlBody: renderEmail(codigoTpl, opts.titulo, { codigo, texto: opts.texto }),
  });
}
