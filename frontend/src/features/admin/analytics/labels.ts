const EVENT_LABELS: Record<string, string> = {
  page_view: "Visita à página",
  hero_view: "Visualizou o hero",
  section_view: "Visualizou seção",
  scroll_25: "Scroll 25%",
  scroll_50: "Scroll 50%",
  scroll_75: "Scroll 75%",
  scroll_100: "Scroll 100%",
  cta_click: "Clique em CTA",
  whatsapp_click: "Clique no WhatsApp",
  email_click: "Clique no e-mail",
  phone_click: "Clique no telefone",
  form_view: "Viu o formulário",
  form_start: "Iniciou o formulário",
  form_submit: "Enviou o cadastro",
  exit_page: "Saiu da página",
  heatmap_click: "Clique (heatmap)",
  heatmap_scroll: "Scroll (heatmap)",
  login: "Login",
  logout: "Logout",
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
  api_error: "Erro de API",
};

const ALERT_RULE_LABELS: Record<string, string> = {
  conversion_drop: "Queda de conversão",
  bounce_high: "Bounce alto",
  traffic_drop: "Queda de acessos",
  form_error: "Erro de formulário",
  api_error: "Erro de API",
  traffic_spike: "Pico de tráfego",
};

export function eventLabel(eventName: string): string {
  return EVENT_LABELS[eventName] ?? eventName;
}

export function alertRuleLabel(rule: string): string {
  return ALERT_RULE_LABELS[rule] ?? rule;
}
