import type { ScheduledEvent } from 'aws-lambda';
import { listAlerts, listDailyAggs, updateAlertTrigger } from '../shared/analytics/db.js';
import { listAdmins } from '../shared/db/index.js';
import { sendEmail } from '../shared/email/index.js';
import { createLogger } from '../shared/core/logger.js';

function dayOffset(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function metric(items: { metricKey: string; count: number }[], key: string): number {
  return items.find((a) => a.metricKey === key)?.count ?? 0;
}

function conversionRate(aggs: { metricKey: string; count: number }[]): number {
  const visitors = metric(aggs, 'event:page_view');
  const signups = metric(aggs, 'event:signup') + metric(aggs, 'event:form_submit');
  if (visitors <= 0) return 0;
  return Math.round((signups / visitors) * 1000) / 10;
}

function bounceRate(aggs: { metricKey: string; count: number }[]): number {
  const views = metric(aggs, 'event:form_view');
  const starts = metric(aggs, 'event:form_start');
  if (views <= 0) return 0;
  return Math.round(((views - starts) / views) * 1000) / 10;
}

function shouldCooldown(lastTriggeredAt: string | undefined): boolean {
  if (lastTriggeredAt === undefined) return false;
  return Date.now() - new Date(lastTriggeredAt).getTime() < 24 * 60 * 60 * 1000;
}

export const handler = async (_event: ScheduledEvent): Promise<void> => {
  const log = createLogger('analyticsAlertsEvaluate');
  const today = dayOffset(0);
  const yesterday = dayOffset(1);
  const [todayAggs, yesterdayAggs, alerts, admins] = await Promise.all([
    listDailyAggs(today),
    listDailyAggs(yesterday),
    listAlerts(),
    listAdmins(),
  ]);

  const recipients = admins.filter((a) => a.ativo && a.email.includes('@')).map((a) => a.email);
  if (recipients.length === 0) {
    log.info('No admin recipients for alerts');
    return;
  }

  const todayConv = conversionRate(todayAggs);
  const yesterdayConv = conversionRate(yesterdayAggs);
  const todayBounce = bounceRate(todayAggs);
  const todayTraffic = metric(todayAggs, 'event:page_view');
  const yesterdayTraffic = metric(yesterdayAggs, 'event:page_view');
  const formErrors = metric(todayAggs, 'event:form_error');
  const apiErrors = metric(todayAggs, 'event:api_error');

  for (const alert of alerts.filter((a) => a.active)) {
    if (shouldCooldown(alert.lastTriggeredAt)) continue;

    let triggered = false;
    let detail = '';

    switch (alert.rule) {
      case 'conversion_drop': {
        const drop = yesterdayConv - todayConv;
        triggered = yesterdayConv > 0 && drop >= alert.threshold;
        detail = `Conversão caiu ${String(drop)} pp (ontem ${String(yesterdayConv)}% → hoje ${String(todayConv)}%).`;
        break;
      }
      case 'bounce_high': {
        triggered = todayBounce >= alert.threshold;
        detail = `Bounce em ${String(todayBounce)}% (limiar ${String(alert.threshold)}%).`;
        break;
      }
      case 'traffic_drop': {
        const dropPct = yesterdayTraffic > 0
          ? Math.round(((yesterdayTraffic - todayTraffic) / yesterdayTraffic) * 1000) / 10
          : 0;
        triggered = yesterdayTraffic > 0 && dropPct >= alert.threshold;
        detail = `Tráfego caiu ${String(dropPct)}% (ontem ${String(yesterdayTraffic)} → hoje ${String(todayTraffic)}).`;
        break;
      }
      case 'traffic_spike': {
        const spikePct = yesterdayTraffic > 0
          ? Math.round(((todayTraffic - yesterdayTraffic) / yesterdayTraffic) * 1000) / 10
          : 0;
        triggered = yesterdayTraffic > 0 && spikePct >= alert.threshold;
        detail = `Tráfego subiu ${String(spikePct)}% (ontem ${String(yesterdayTraffic)} → hoje ${String(todayTraffic)}).`;
        break;
      }
      case 'form_error': {
        triggered = formErrors >= alert.threshold;
        detail = `${String(formErrors)} erros de formulário hoje (limiar ${String(alert.threshold)}).`;
        break;
      }
      case 'api_error': {
        triggered = apiErrors >= alert.threshold;
        detail = `${String(apiErrors)} erros de API hoje (limiar ${String(alert.threshold)}).`;
        break;
      }
      default:
        break;
    }

    if (!triggered) continue;

    const now = new Date().toISOString();
    await updateAlertTrigger(alert.id, now);

    const subject = `[Atlas Analytics] ${alert.name}`;
    const htmlBody = `
      <h2>Alerta: ${alert.name}</h2>
      <p><strong>Regra:</strong> ${alert.rule}</p>
      <p><strong>Limiar:</strong> ${String(alert.threshold)}</p>
      <p>${detail}</p>
      <p>Dia: ${today}</p>
    `;
    const textBody = `${alert.name}\n${alert.rule}\n${detail}\nDia: ${today}`;

    await Promise.all(recipients.map((to) => sendEmail({ to, subject, htmlBody, textBody })));
    log.info('Alert triggered', { id: alert.id, rule: alert.rule, recipients: recipients.length });
  }
};
