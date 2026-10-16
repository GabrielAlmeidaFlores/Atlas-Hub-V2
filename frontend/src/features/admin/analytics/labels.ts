const EVENT_LABELS: Record<string, string> = {
  page_view: "Visita à página",
  hero_view: "Visualizou o topo da página",
  section_view: "Visualizou seção",
  scroll_25: "Rolagem 25%",
  scroll_50: "Rolagem 50%",
  scroll_75: "Rolagem 75%",
  scroll_100: "Rolagem 100%",
  cta_click: "Clique em CTA",
  whatsapp_click: "Clique no WhatsApp",
  email_click: "Clique no e-mail",
  phone_click: "Clique no telefone",
  form_view: "Viu o formulário",
  form_start: "Iniciou o formulário",
  form_submit: "Enviou o cadastro",
  exit_page: "Saiu da página",
  heatmap_click: "Clique (mapa de calor)",
  heatmap_scroll: "Rolagem (mapa de calor)",
  login: "Login",
  logout: "Saída",
  signup: "Cadastro criado",
  email_confirmed: "E-mail confirmado",
  password_recovery: "Recuperação de senha",
  profile_updated: "Perfil atualizado",
  company_doc_uploaded: "Documento da empresa enviado",
  project_created: "Projeto criado",
  project_updated: "Projeto atualizado",
  project_doc_uploaded: "Documento do projeto enviado",
  project_photo_uploaded: "Foto do projeto enviada",
  project_submitted: "Projeto submetido",
  project_resubmitted: "Projeto resubmetido",
  curation_started: "Curadoria iniciada",
  curation_adjustment: "Ajuste solicitado",
  curation_rejected: "Projeto reprovado",
  curation_approved: "Projeto aprovado",
  offer_published: "Oferta publicada",
  api_error: "Erro na API",
};

export interface AlertRuleMeta {
  readonly rule: string;
  readonly label: string;
  readonly unit: string;
  readonly desc: string;
  readonly defaultValue: number;
}

export const ALERT_RULES: readonly AlertRuleMeta[] = [
  { rule: "conversion_drop", label: "Queda de conversão", unit: "pontos percentuais", desc: "Dispara se a conversão cair X pontos percentuais em relação a ontem.", defaultValue: 5 },
  { rule: "bounce_high", label: "Rejeição alta", unit: "%", desc: "Dispara se a taxa de rejeição de hoje atingir X% ou mais.", defaultValue: 60 },
  { rule: "traffic_drop", label: "Queda de acessos", unit: "%", desc: "Dispara se os acessos caírem X% em relação a ontem.", defaultValue: 30 },
  { rule: "traffic_spike", label: "Pico de tráfego", unit: "%", desc: "Dispara se os acessos subirem X% em relação a ontem.", defaultValue: 50 },
  { rule: "form_error", label: "Erros de formulário", unit: "ocorrências no dia", desc: "Dispara se houver X ou mais erros de formulário no dia.", defaultValue: 5 },
  { rule: "api_error", label: "Erros na API", unit: "ocorrências no dia", desc: "Dispara se houver X ou mais erros de API no dia.", defaultValue: 5 },
];

export function eventLabel(eventName: string): string {
  return EVENT_LABELS[eventName] ?? eventName;
}

export function alertRuleMeta(rule: string): AlertRuleMeta | null {
  return ALERT_RULES.find((r) => r.rule === rule) ?? null;
}

export function descreverAlerta(rule: string, threshold: number): string {
  const meta = alertRuleMeta(rule);
  if (meta === null) return `Regra ${rule} ≥ ${String(threshold)}`;
  return `Dispara quando ${meta.label.toLowerCase()} atinge ${String(threshold)} ${meta.unit}.`;
}
