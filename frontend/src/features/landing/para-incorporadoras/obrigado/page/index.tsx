import { type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { MarketingShell } from "@/features/landing/components/marketing-shell";

export default function ParaIncorporadorasObrigadoPage(): ReactNode {
  const [params] = useSearchParams();
  const leadId = params.get("leadId") ?? "";
  const token = params.get("token") ?? "";
  const duplicate = params.get("duplicate") === "1";
  const valid = leadId.length > 0 && token.length > 0;
  const qualificationUrl = `/para-incorporadoras/qualificacao?leadId=${encodeURIComponent(leadId)}&token=${encodeURIComponent(token)}`;

  return (
    <MarketingShell>
      <section className="bg-[#F4F5F7] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-[14px] border border-border bg-white p-7 shadow-[0_12px_30px_rgba(27,43,94,0.08)] sm:p-10">
          {duplicate ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-success-subtle">
                <CheckCircle2 className="h-6 w-6 text-status-success" />
              </div>
              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D2A047]">Cadastro já recebido</p>
              <h1 className="mt-3 text-2xl font-extrabold leading-tight text-navy sm:text-3xl">Já temos seu cadastro</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Este e-mail já está registrado na nossa base. Se você ainda não respondeu às perguntas de qualificação, nossa equipe dará continuidade pelo contato informado.</p>
              <Link to="/" className="btn btn-gold mt-6">Voltar ao início</Link>
            </>
          ) : valid ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-success-subtle">
                <CheckCircle2 className="h-6 w-6 text-status-success" />
              </div>
              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D2A047]">Cadastro recebido</p>
              <h1 className="mt-3 text-2xl font-extrabold leading-tight text-navy sm:text-3xl">Seu cadastro foi recebido</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Agora faltam apenas dois passos para avançar com sua solicitação de diagnóstico.
              </p>
              <div className="mt-7 space-y-4">
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">1</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Conte sobre seu empreendimento</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Responda a 10 perguntas rápidas para conhecermos o estágio do projeto, a necessidade de capital e o momento da incorporação. Leva aproximadamente 3 minutos.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">2</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Avaliação da nossa equipe</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Com suas respostas, verificaremos a compatibilidade inicial do empreendimento e prepararemos um contato mais direcionado.</p>
                  </div>
                </div>
              </div>
              <Link to={qualificationUrl} className="btn btn-gold mt-8 w-full">
                Continuar para as perguntas <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" /> Tempo estimado: 3 minutos
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-navy">Link inválido</h1>
              <p className="mt-3 text-sm text-muted-foreground">Não encontramos os dados desta solicitação. Volte à página e preencha o formulário novamente.</p>
              <Link to="/para-incorporadoras#diagnostico" className="btn btn-gold mt-6">Voltar ao formulário</Link>
            </>
          )}
          <p className="mt-8 flex items-start gap-2 border-t border-border pt-5 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> As informações serão utilizadas exclusivamente para qualificação inicial e contato relacionado à sua solicitação, conforme nossa Política de Privacidade.
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
