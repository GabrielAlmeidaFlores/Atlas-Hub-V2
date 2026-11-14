import { useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { api, getApiErrorMessage } from "@/services/api";
import { trackMetaEvent } from "@/lib/meta-pixel";

interface Question {
  readonly key: string;
  readonly title: string;
  readonly description?: string;
  readonly type: "single" | "multi" | "location";
  readonly options?: readonly string[];
}

const QUESTIONS: readonly Question[] = [
  { key: "papel", title: "Qual é o seu papel na empresa responsável pelo empreendimento?", description: "Selecione a opção que melhor descreve sua atuação.", type: "single", options: ["Sou sócio ou proprietário da incorporadora", "Sou diretor ou gestor responsável pelo empreendimento", "Sou responsável financeiro ou pela captação de recursos", "Sou parceiro ou representante do empreendimento", "Estou desenvolvendo minha primeira incorporação", "Outro"] },
  { key: "tipoEmpreendimento", title: "Qual é o perfil do empreendimento que você pretende desenvolver?", type: "single", options: ["Residencial voltado ao Minha Casa Minha Vida — Faixa 3", "Residencial voltado ao Minha Casa Minha Vida — Faixa 4", "Residencial de médio ou alto padrão", "Condomínio de casas", "Loteamento", "Empreendimento comercial ou misto", "Outro"] },
  { key: "localizacao", title: "Em qual cidade e estado fica o empreendimento?", description: "Informe o estado e a cidade do projeto.", type: "location" },
  { key: "situacaoTerreno", title: "Qual é a situação atual do terreno?", type: "single", options: ["Terreno próprio ou da empresa", "Permuta formalizada", "Permuta em negociação", "Aquisição do terreno em negociação", "Terreno de terceiro com parceria em estudo", "Ainda não tenho terreno definido"] },
  { key: "estagio", title: "Em qual estágio está o empreendimento?", type: "single", options: ["Tenho o terreno, mas ainda estou desenvolvendo o estudo de viabilidade", "Viabilidade concluída e projeto em desenvolvimento", "Projeto em aprovação nos órgãos competentes", "Projeto aprovado e preparação para execução", "Obra iniciada", "Ainda estou estruturando a oportunidade"] },
  { key: "vgv", title: "Qual é o VGV (Valor Geral de Vendas) estimado do empreendimento?", type: "single", options: ["Até R$ 2 milhões", "De R$ 2 milhões a R$ 5 milhões", "De R$ 5 milhões a R$ 10 milhões", "De R$ 10 milhões a R$ 30 milhões", "Acima de R$ 30 milhões", "Ainda não tenho o VGV definido"] },
  { key: "valorPretendido", title: "Qual é o valor aproximado que você pretende captar?", type: "single", options: ["Até R$ 300 mil", "De R$ 300 mil a R$ 500 mil", "De R$ 500 mil a R$ 1 milhão", "De R$ 1 milhão a R$ 3 milhões", "De R$ 3 milhões a R$ 5 milhões", "Acima de R$ 5 milhões", "Ainda estou definindo"] },
  { key: "finalidade", title: "Para qual finalidade pretende utilizar os recursos?", type: "single", options: ["Aquisição ou composição de terreno", "Desenvolvimento de projetos e aprovações", "Preparação e início da construção", "Execução ou continuidade da obra", "Complementação de capital para um empreendimento em andamento", "Expansão para novos empreendimentos", "Outra finalidade"] },
  { key: "prazoCaptacao", title: "Em quanto tempo pretende iniciar a captação?", type: "single", options: ["Imediatamente, nos próximos 30 dias", "Entre 1 e 3 meses", "Entre 3 e 6 meses", "Entre 6 e 12 meses", "Daqui a mais de 12 meses", "Ainda estou avaliando"] },
  { key: "documentos", title: "Quais informações e documentos do empreendimento você já possui?", description: "Você pode selecionar mais de uma opção.", type: "multi", options: ["Estudo de viabilidade econômico-financeira", "Projeto arquitetônico ou estudo preliminar", "Documentação do terreno ou permuta", "Orçamento de obra", "Cronograma físico-financeiro", "Aprovações ou licenças aplicáveis", "Ainda estou reunindo os documentos"] },
];

type Answer = string | string[];

export default function ParaIncorporadorasQualificacaoPage(): ReactNode {
  const [params] = useSearchParams();
  const leadId = params.get("leadId") ?? "";
  const token = params.get("token") ?? "";
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const current = QUESTIONS[step];
  const valid = leadId.length > 0 && token.length > 0 && current !== undefined;
  const answer = current === undefined ? undefined : answers[current.key];
  const canContinue = useMemo(() => {
    if (current === undefined) return false;
    if (current.type === "multi") return Array.isArray(answer) && answer.length > 0;
    if (current.type === "location") return typeof answers.estado === "string" && answers.estado.length > 0 && typeof answers.cidade === "string" && answers.cidade.trim().length >= 2;
    return typeof answer === "string" && answer.trim().length > 0;
  }, [answer, answers.cidade, answers.estado, current]);

  function choose(option: string): void {
    if (current === undefined) return;
    if (current.type === "multi") {
      const selected = Array.isArray(answer) ? answer : [];
      setAnswers((all) => ({ ...all, [current.key]: selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option] }));
      return;
    }
    setAnswers((all) => ({ ...all, [current.key]: option }));
  }

  async function submit(): Promise<void> {
    if (!valid || !canContinue) return;
    if (step < QUESTIONS.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.put(`/publico/leads/${encodeURIComponent(leadId)}/qualificacao?token=${encodeURIComponent(token)}`, answers);
      trackMetaEvent("CompleteRegistration", { content_name: "Qualificacao de captacao" });
      setFinished(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!valid) {
    return (
      <MarketingShell>
        <section className="bg-[#F4F5F7] px-4 py-16">
          <div className="mx-auto max-w-xl rounded-[12px] border border-border bg-white p-8 text-center">
            <h1 className="text-xl font-bold text-navy">Link inválido</h1>
            <p className="mt-2 text-sm text-muted-foreground">Volte ao formulário e solicite seu diagnóstico novamente.</p>
            <Link to="/para-incorporadoras#diagnostico" className="btn btn-gold mt-6">Voltar ao formulário</Link>
          </div>
        </section>
      </MarketingShell>
    );
  }

  if (finished) {
    return (
      <MarketingShell>
        <section className="bg-[#F4F5F7] px-4 py-16">
          <div className="mx-auto max-w-2xl rounded-[14px] border border-border bg-white p-8 text-center shadow-[0_12px_30px_rgba(27,43,94,0.08)] sm:p-10">
            <CheckCircle2 className="mx-auto h-12 w-12 text-status-success" />
            <h1 className="mt-5 text-2xl font-extrabold text-navy">Recebemos as informações do seu empreendimento!</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Agora nossa equipe vai avaliar os dados fornecidos para identificar a compatibilidade inicial do projeto com as possibilidades de captação atendidas.</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Se houver aderência, um de nossos consultores entrará em contato para conversar sobre seu empreendimento e os próximos passos para o diagnóstico.</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Fique atento ao seu WhatsApp e e-mail.</p>
            <p className="mt-5 text-xs text-muted-foreground">O preenchimento não garante agendamento, aprovação do projeto ou obtenção de recursos.</p>
            <Link to="/" className="btn btn-gold mt-7">Voltar ao início</Link>
          </div>
        </section>
      </MarketingShell>
    );
  }

  return (
    <MarketingShell>
      <section className="bg-[#F4F5F7] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Pré-avaliação do empreendimento</span>
            <span>{String(step + 1)} de {String(QUESTIONS.length)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-border">
            <div className="h-full bg-[#D2A047] transition-all" style={{ width: `${String(((step + 1) / QUESTIONS.length) * 100)}%` }} />
          </div>
          <div className="mt-6 rounded-[14px] border border-border bg-white p-6 shadow-[0_12px_30px_rgba(27,43,94,0.08)] sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D2A047]">Pergunta {String(step + 1)} de {String(QUESTIONS.length)}</p>
            <h1 className="mt-3 text-xl font-extrabold leading-snug text-navy sm:text-2xl">{current.title}</h1>
            {current.description !== undefined && <p className="mt-2 text-sm text-muted-foreground">{current.description}</p>}
            <div className="mt-6 space-y-2.5">
              {current.type === "location" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <select className="field" value={typeof answers.estado === "string" ? answers.estado : ""} onChange={(event) => setAnswers((all) => ({ ...all, estado: event.target.value }))} aria-label="Estado" autoFocus>
                    <option value="">Selecione o estado</option>
                    <option value="São Paulo">São Paulo</option>
                    <option value="Minas Gerais">Minas Gerais</option>
                    <option value="Outro estado">Outro estado</option>
                  </select>
                  <input className="field" value={typeof answers.cidade === "string" ? answers.cidade : ""} onChange={(event) => setAnswers((all) => ({ ...all, cidade: event.target.value }))} placeholder="Cidade" maxLength={120} aria-label="Cidade" />
                </div>
              ) : (
                current.options?.map((option) => {
                  const selected = current.type === "multi" ? Array.isArray(answer) && answer.includes(option) : answer === option;
                  return (
                    <button key={option} type="button" onClick={() => choose(option)} className={`flex w-full items-center gap-3 rounded-[8px] border px-4 py-3 text-left text-sm transition-colors ${selected ? "border-[#D2A047] bg-[#FFF8EB] text-navy" : "border-border bg-white text-foreground hover:border-[#D2A047]/60"}`}>
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center border ${current.type === "multi" ? "rounded-[3px]" : "rounded-full"} ${selected ? "border-[#D2A047] bg-[#D2A047]" : "border-border"}`}>
                        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                      {option}
                    </button>
                  );
                })
              )}
            </div>
            {error !== null && <p className="mt-4 text-xs font-medium text-status-danger">{error}</p>}
            <div className="mt-7 flex items-center justify-between gap-3">
              <button type="button" className="btn btn-outline" disabled={step === 0 || saving} onClick={() => setStep((value) => value - 1)}>
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
              <button type="button" className="btn btn-gold" disabled={!canContinue || saving} onClick={() => void submit()}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : step === QUESTIONS.length - 1 ? "ENVIAR MINHAS INFORMAÇÕES" : <>Continuar <ArrowRight className="h-4 w-4" /></>}
              </button>
            </div>
          </div>
          <p className="mt-5 flex items-start justify-center gap-2 text-center text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Suas respostas serão usadas para qualificação inicial e contato sobre sua solicitação.
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
