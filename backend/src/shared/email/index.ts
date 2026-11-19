import { APP_URL, EMAIL_FROM, RESEND_API_KEY } from '../core/env.js';
import base from './templates/base.html';
import boasVindasTpl from './templates/boas-vindas.html';
import projetoRecebidoTpl from './templates/projeto-recebido.html';
import ajusteTpl from './templates/ajuste-solicitado.html';
import reprovadoTpl from './templates/reprovado.html';
import aprovadoTpl from './templates/aprovado.html';
import ofertaTpl from './templates/oferta-criada.html';
import novoAcessoTpl from './templates/novo-acesso.html';
import conviteUsuarioTpl from './templates/convite-usuario.html';
import codigoTpl from './templates/codigo.html';
import notificacaoCardTpl from './templates/notificacao-card.html';

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
  readonly idempotencyKey?: string;
}

export class EmailError extends Error {
  readonly status: number;
  readonly resendCode?: string | undefined;

  constructor(message: string, status: number, resendCode?: string) {
    super(message);
    this.name = 'EmailError';
    this.status = status;
    this.resendCode = resendCode;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeSubject(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function sendEmail(params: EmailParams): Promise<void> {
  if (RESEND_API_KEY.length === 0) throw new Error('RESEND_API_KEY não configurada');
  if (params.to.trim().length === 0) throw new Error('Destinatário de e-mail vazio');

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      ...(params.idempotencyKey !== undefined ? { 'Idempotency-Key': params.idempotencyKey } : {}),
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
    let resendCode: string | undefined;
    try {
      const parsed = JSON.parse(detail) as { name?: unknown; message?: unknown };
      resendCode = typeof parsed.name === 'string' ? parsed.name : undefined;
    } catch {
      resendCode = undefined;
    }
    throw new EmailError(`Resend falhou (${String(res.status)}): ${detail}`, res.status, resendCode);
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

export function emailConviteUsuario(
  to: string,
  nome: string,
  perfil: string,
  temporaryPassword: string,
): Promise<void> {
  return sendEmail({
    to,
    subject: 'Seu acesso à Atlas Hub',
    htmlBody: renderEmail(conviteUsuarioTpl, 'Bem-vindo à Atlas Hub', {
      nome,
      email: to,
      perfil,
      senhaTemporaria: temporaryPassword,
    }, {
      label: 'Acessar a Atlas Hub',
      url: `${APP_URL}/login`,
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

export function emailBoardCardNotification(params: {
  readonly to: string;
  readonly boardName: string;
  readonly cardTitle: string;
  readonly cardDescription?: string;
  readonly columnName: string;
  readonly fromColumnName?: string;
  readonly toColumnName?: string;
  readonly changedFields?: readonly string[];
  readonly actorLabel?: string;
  readonly occurredAt?: string;
  readonly event: "CARD_CREATED" | "CARD_MOVED_TO_COLUMN" | "CARD_UPDATED" | "CARD_ARCHIVED" | "CARD_REMOVED";
  readonly boardUrl: string;
  readonly idempotencyKey: string;
}): Promise<void> {
  const eventLabels: Record<typeof params.event, string> = {
    CARD_CREATED: 'Novo card',
    CARD_MOVED_TO_COLUMN: 'Card movido',
    CARD_UPDATED: 'Card alterado',
    CARD_ARCHIVED: 'Card arquivado',
    CARD_REMOVED: 'Card removido',
  };
  const eventLabel = eventLabels[params.event];
  const subject = params.event === 'CARD_MOVED_TO_COLUMN' && params.toColumnName !== undefined
    ? safeSubject(`Card movido para ${params.toColumnName} em ${params.boardName}: ${params.cardTitle}`)
    : safeSubject(`${eventLabel} em ${params.boardName}: ${params.cardTitle}`);
  const description = params.cardDescription?.trim() ?? '';
  const descriptionBlock = description.length > 0
    ? `<div style="margin:18px 0 0;padding:16px 18px;border-left:3px solid #C49020;background:#F8FAFC;border-radius:0 8px 8px 0"><p style="margin:0;font-size:13px;line-height:1.7;color:#475569;white-space:pre-line">${escapeHtml(description)}</p></div>`
    : '';
  const details: string[] = [];
  if (params.event === 'CARD_MOVED_TO_COLUMN') {
    if (params.fromColumnName !== undefined) details.push(`<p style="margin:0 0 6px"><strong>De:</strong> ${escapeHtml(params.fromColumnName)}</p>`);
    if (params.toColumnName !== undefined) details.push(`<p style="margin:0 0 6px"><strong>Para:</strong> ${escapeHtml(params.toColumnName)}</p>`);
  } else if (params.event === 'CARD_ARCHIVED' || params.event === 'CARD_REMOVED') {
    if (params.fromColumnName !== undefined) details.push(`<p style="margin:0 0 6px"><strong>Coluna anterior:</strong> ${escapeHtml(params.fromColumnName)}</p>`);
  } else if (params.event === 'CARD_CREATED') {
    details.push(`<p style="margin:0 0 6px"><strong>Coluna:</strong> ${escapeHtml(params.columnName)}</p>`);
  } else if (params.changedFields !== undefined && params.changedFields.length > 0) {
    details.push(`<p style="margin:0 0 6px"><strong>Campos alterados:</strong> ${escapeHtml(params.changedFields.join(', '))}</p>`);
  }
  if (params.actorLabel !== undefined) details.push(`<p style="margin:0 0 6px"><strong>Responsável:</strong> ${escapeHtml(params.actorLabel)}</p>`);
  if (params.occurredAt !== undefined) {
    const date = new Date(params.occurredAt);
    if (!Number.isNaN(date.getTime())) {
      details.push(`<p style="margin:0"><strong>Data:</strong> ${escapeHtml(date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }))}</p>`);
    }
  }
  const eventBlock = details.length > 0
    ? `<div style="margin:18px 0 0;padding:14px 18px;background:#F4F6FA;border-radius:8px;font-size:13px;line-height:1.6;color:#475569">${details.join('')}</div>`
    : '';
  return sendEmail({
    to: params.to,
    subject,
    htmlBody: renderEmail(notificacaoCardTpl, escapeHtml(eventLabel), {
      boardName: escapeHtml(params.boardName),
      cardTitle: escapeHtml(params.cardTitle),
      columnName: escapeHtml(params.columnName),
      descriptionBlock,
      eventBlock,
    }, {
      label: 'Abrir quadro',
      url: params.boardUrl,
    }),
    idempotencyKey: params.idempotencyKey,
  });
}
