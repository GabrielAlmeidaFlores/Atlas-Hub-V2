import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { TERMS_UPDATED_AT, TERMS_VERSION } from "@/lib/legal";

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
      <main className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">Atlas Hub</p>
        <h1 className="mt-3 text-3xl font-extrabold uppercase tracking-tight text-navy sm:text-4xl">{title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{intro}</p>
        <p className="mt-3 text-xs text-muted-foreground">Última atualização: {TERMS_UPDATED_AT} · Versão {TERMS_VERSION}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section, index) => (
            <section key={section.title}>
              <h2 className="text-base font-bold text-navy">
                {String(index + 1)}. {section.title}
              </h2>
              <div className="mt-2 space-y-2">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          Dúvidas sobre este documento:{" "}
          <a href="mailto:contato@atlascomp.com.br" className="font-semibold text-navy hover:underline">
            contato@atlascomp.com.br
          </a>
          . Consulte também a{" "}
          <Link to="/privacidade" className="font-semibold text-navy hover:underline">
            Política de Privacidade
          </Link>
          .
        </div>
      </main>
    </MarketingShell>
  );
}
