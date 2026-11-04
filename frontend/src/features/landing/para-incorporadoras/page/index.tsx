import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, FileCheck, LineChart, MapPin, ShieldCheck } from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { api, getApiErrorMessage } from "@/services/api";
import { captureLeadTracking } from "@/lib/lead-tracking";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { useLandingAnalytics } from "@/lib/analytics/use-landing-analytics";
import { normalizePhoneDigits } from "@/lib/utils";

interface LeadResponse {
  readonly leadId: string;
  readonly qualificationToken: string | null;
  readonly duplicate?: boolean;
}

function Hero(): ReactNode {
  return (
    <section className="relative overflow-visible bg-gradient-to-b from-[#D1D1D6] via-[#E7E7EA] via-40% to-white to-65% px-4 pb-[40px] pt-5 sm:px-6 lg:px-8" data-analytics-section="hero">
      <div className="relative overflow-hidden rounded-[14px] bg-[#001F4E] shadow-[0_10px_30px_rgba(7,17,34,0.18)]">
        <img src="/bg-incorporadoras.png" alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-80" />
        <div className="absolute inset-0 bg-[#001F4E]/80" aria-hidden />
        <div className="lp-container relative flex min-h-[520px] items-center py-16 lg:min-h-[600px]">
          <div className="max-w-[760px]">
            <p className="mb-5 text-[11px] uppercase tracking-[0.32em] text-[#D2A047]">
              <span className="font-light">Para </span>
              <span className="font-semibold">incorporadoras</span>
            </p>
            <h1 className="text-[34px] font-extrabold uppercase leading-[1.08] tracking-[0.02em] text-white sm:text-[42px] lg:text-[52px]">
              O futuro do seu empreendimento começa com uma boa decisão sobre capital
            </h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-relaxed text-white/80 sm:text-lg">
              Conheça as possibilidades de captação com investidores e receba direcionamento inicial para avaliar o próximo passo do seu projeto.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#diagnostico" className="inline-flex h-12 items-center justify-center gap-2 rounded-[4px] bg-[#D2A047] px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                Solicitar meu diagnóstico <ArrowRight className="h-4 w-4" />
              </a>
              <Link to="/login" className="inline-flex h-12 items-center justify-center rounded-[4px] border border-white/30 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MarketContext(): ReactNode {
  return (
    <section className="bg-white py-14 lg:py-18" data-analytics-section="contexto">
      <div className="lp-container max-w-4xl text-center">
        <AnimateIn>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D2A047]">O mercado continua avançando</p>
          <h2 className="mt-4 text-[30px] font-bold uppercase leading-[1.08] tracking-[-0.05em] text-navy sm:text-[38px] lg:text-[46px]">
            Seu próximo empreendimento também pode encontrar novos caminhos
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-[#3A3A3A] sm:text-base">
            Mesmo em um cenário econômico de mudanças, o setor imobiliário brasileiro segue movimentando investimentos, obras e oportunidades. Só no primeiro semestre de 2026, foram vendidos mais de 226 mil imóveis residenciais novos no Brasil, um crescimento de 5,4% em relação ao ano anterior.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#3A3A3A] sm:text-base">
            Financiamento bancário, recursos próprios e captação com investidores são possibilidades que merecem ser avaliadas conforme as características de cada projeto.
          </p>
          <p className="mt-5 text-xs text-muted-foreground">Fonte: CBIC — Indicadores Imobiliários Nacionais, 24 de agosto de 2026.</p>
        </AnimateIn>
      </div>
    </section>
  );
}

const DECISIONS = [
  {
    icon: Building2,
    title: "Seu empreendimento tem perfil para captação?",
    text: "Entenda quais características do projeto são consideradas em uma avaliação inicial de compatibilidade com uma estrutura de captação junto a investidores.",
  },
  {
    icon: LineChart,
    title: "Quais possibilidades fazem sentido para o seu projeto?",
    text: "Conheça o funcionamento do modelo de captação estruturada, suas condições gerais e os fatores que precisam ser analisados para avaliar sua aplicabilidade.",
  },
  {
    icon: MapPin,
    title: "Qual é o próximo passo para avançar?",
    text: "Receba direcionamento inicial sobre informações, documentos e análises necessários para que o projeto possa seguir para uma eventual etapa de curadoria.",
  },
] as const;

function DiagnosticDecisions(): ReactNode {
  return (
    <section className="bg-[#001F4E] py-14 lg:py-18" data-analytics-section="diagnostico">
      <div className="lp-container">
        <AnimateIn className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D2A047]">Atendimento exclusivo de diagnóstico</p>
          <h2 className="mt-4 text-[30px] font-bold uppercase leading-[1.08] tracking-[-0.05em] text-white sm:text-[38px] lg:text-[46px]">
            Entenda como seu empreendimento pode avançar rumo a uma possível captação
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-white/70 sm:text-base">
            Nossa equipe busca compreender o seu projeto e oferecer direcionamento sobre três decisões essenciais.
          </p>
        </AnimateIn>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {DECISIONS.map(({ icon: Icon, title, text }, index) => (
            <AnimateIn key={title} delay={index * 80} className="rounded-[10px] border border-white/15 bg-white/5 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[#D2A047] text-[#001F4E]">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-[#D2A047]">0{String(index + 1)}</p>
              <h3 className="mt-2 text-lg font-bold leading-snug text-white">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{text}</p>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function AtlasExplanation(): ReactNode {
  return (
    <section className="bg-white py-14 lg:py-18" data-analytics-section="atlas">
      <div className="lp-container grid gap-10 lg:grid-cols-2 lg:items-center">
        <AnimateIn>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D2A047]">Conheça a Atlas Hub</p>
          <h2 className="mt-4 text-[30px] font-bold uppercase leading-[1.08] tracking-[-0.05em] text-navy sm:text-[38px] lg:text-[44px]">
            Seu projeto merece uma avaliação criteriosa antes de dar o próximo passo
          </h2>
        </AnimateIn>
        <AnimateIn delay={80} className="space-y-4 text-sm leading-relaxed text-[#3A3A3A] sm:text-base">
          <p>
            A Atlas Hub é especializada na originação e curadoria de projetos imobiliários, criada para conectar empreendimentos com potencial de desenvolvimento a possibilidades de captação de recursos junto a investidores.
          </p>
          <p>
            Recebemos e avaliamos oportunidades apresentadas por incorporadoras e construtoras, considerando localização, viabilidade técnica e financeira, estrutura do empreendimento e capacidade de execução.
          </p>
          <p>
            Para operações de investimento participativo, a Atlas atua em parceria com a Divify, plataforma registrada na CVM, observadas as condições e exigências aplicáveis a cada operação.
          </p>
          <p className="font-semibold text-navy">
            Para incorporadoras e construtoras que já possuem um empreendimento ou terreno definido e desejam compreender se a captação com investidores pode ser uma alternativa.
          </p>
        </AnimateIn>
      </div>
    </section>
  );
}

function DiagnosticForm(): ReactNode {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: "", email: "", whatsapp: "", consentimento: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    const digits = normalizePhoneDigits(form.whatsapp);
    if (form.nome.trim().length < 2) return setError("Informe seu nome");
    if (!form.email.includes("@")) return setError("Informe um e-mail válido");
    if (digits.length !== 10 && digits.length !== 11) return setError("Informe um WhatsApp válido com DDD");
    if (!form.consentimento) return setError("Aceite a Política de Privacidade para continuar");
    setSaving(true);
    try {
      const tracking = captureLeadTracking();
      const result = await api.post<LeadResponse>("/publico/leads", {
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        whatsapp: `+55${digits}`,
        consentimento: true,
        ...tracking,
      });
      trackMetaEvent("Lead", { content_name: "Diagnostico de captacao" });
      if (result.duplicate === true || result.qualificationToken === null) {
        navigate("/para-incorporadoras/obrigado?duplicate=1");
        return;
      }
      navigate(`/para-incorporadoras/obrigado?leadId=${encodeURIComponent(result.leadId)}&token=${encodeURIComponent(result.qualificationToken)}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="diagnostico" className="scroll-mt-20 bg-[#F4F5F7] py-14 lg:py-18" data-analytics-section="solicite-avaliacao">
      <div className="lp-container grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
        <AnimateIn className="lg:col-span-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D2A047]">Solicite seu diagnóstico</p>
          <h2 className="mt-4 text-[30px] font-bold uppercase leading-[1.08] tracking-[-0.05em] text-navy sm:text-[38px] lg:text-[44px]">
            Comece descobrindo quais caminhos fazem sentido para o seu projeto
          </h2>
          <div className="mt-8 space-y-4 text-sm leading-relaxed text-[#3A3A3A] sm:text-base">
            <p><strong>01 — Apresente seu empreendimento.</strong> Conte um pouco sobre o projeto, sua localização, o capital pretendido e o prazo.</p>
            <p><strong>02 — Nossa equipe avalia as informações.</strong> Analisamos os dados iniciais para identificar aderência ao perfil de projetos atendidos.</p>
            <p><strong>03 — Converse com nossa equipe.</strong> Se houver compatibilidade inicial, você poderá ser convidado para uma sessão de até 1 hora.</p>
          </div>
        </AnimateIn>
        <AnimateIn delay={80} className="lg:col-span-7">
          <form onSubmit={(event) => void handleSubmit(event)} className="rounded-[12px] border border-[#D9DEE7] bg-white p-6 shadow-[0_12px_30px_rgba(27,43,94,0.08)] sm:p-8">
            <h3 className="text-lg font-bold text-navy">Solicitar meu diagnóstico</h3>
            <p className="mt-1 text-xs text-muted-foreground">O primeiro passo leva menos de um minuto.</p>
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="form-label">Nome</span>
                <input className="field mt-1.5" value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} placeholder="Seu nome" autoComplete="name" required />
              </label>
              <label className="block">
                <span className="form-label">E-mail</span>
                <input type="email" className="field mt-1.5" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="seu@email.com.br" autoComplete="email" required />
              </label>
              <label className="block">
                <span className="form-label">WhatsApp</span>
                <input type="tel" className="field mt-1.5" value={form.whatsapp} onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))} placeholder="(11) 99999-9999" autoComplete="tel" required />
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <input type="checkbox" className="mt-0.5" checked={form.consentimento} onChange={(event) => setForm((current) => ({ ...current, consentimento: event.target.checked }))} />
                <span>Autorizo o uso dos meus dados para contato sobre meu diagnóstico, conforme a <Link to="/privacidade" className="font-semibold text-navy underline">Política de Privacidade</Link>.</span>
              </label>
              {error !== null && <p className="text-xs font-medium text-status-danger">{error}</p>}
              <button type="submit" disabled={saving} className="btn btn-gold w-full">
                {saving ? "Enviando…" : "Solicitar meu diagnóstico"}
              </button>
            </div>
            <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> O diagnóstico oferece direcionamento preliminar e não garante aprovação ou captação.
            </p>
          </form>
        </AnimateIn>
      </div>
    </section>
  );
}

export default function ParaIncorporadorasPage(): ReactNode {
  useLandingAnalytics(true);
  return (
    <MarketingShell>
      <Hero />
      <MarketContext />
      <DiagnosticDecisions />
      <AtlasExplanation />
      <DiagnosticForm />
      <section className="bg-white py-8">
        <div className="lp-container flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <FileCheck className="h-4 w-4" /> Atlas Hub LTDA — CNPJ 68.693.823/0001-83
        </div>
      </section>
    </MarketingShell>
  );
}
