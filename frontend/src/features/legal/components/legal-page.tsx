import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { TERMS_UPDATED_AT } from "@/lib/legal";

interface LegalSection {
  readonly title: string;
  readonly paragraphs: readonly string[];
}

interface LegalPageProps {
  readonly title: string;
  readonly intro: string;
  readonly sections: readonly LegalSection[];
}

export function LegalPage({ title, intro, sections }: LegalPageProps): ReactNode {
  return (
    <MarketingShell>
      <main className="pb-16 sm:pb-20">
        <section className="border-b border-border bg-[#F8F6F1]">
          <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <Link to="/legal" className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark transition-colors hover:text-gold">
              Central Legal <ChevronRight className="h-3 w-3" />
            </Link>
            <h1 className="mt-4 text-3xl font-extrabold uppercase tracking-tight text-navy sm:text-4xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{intro}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]">
              <span className="border border-gold/30 bg-gold/10 px-2 py-1 text-gold-dark">Documento institucional</span>
              <span className="text-muted-foreground">Atualizado em {TERMS_UPDATED_AT}</span>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-4xl px-4 pt-10 sm:px-6 sm:pt-12 lg:px-8">
          <article className="border border-border bg-card px-5 py-7 shadow-[0_8px_24px_rgb(15_23_42/0.04)] sm:px-8 sm:py-9">
            <div className="space-y-8">
              {sections.map((section, index) => (
                <section key={section.title} className="grid gap-2 sm:grid-cols-[42px_1fr] sm:gap-4">
                  <span className="text-[11px] font-bold tracking-[0.12em] text-gold">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h2 className="text-[15px] font-bold text-navy">{section.title}</h2>
                    <div className="mt-2 space-y-2.5">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </article>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
            <span>Dúvidas sobre este documento? <a href="mailto:contato@atlascomp.com.br" className="font-semibold text-navy hover:underline">contato@atlascomp.com.br</a></span>
            <Link to="/legal" className="font-semibold text-navy hover:underline">Voltar à Central Legal</Link>
          </div>
        </div>
      </main>
    </MarketingShell>
  );
}
