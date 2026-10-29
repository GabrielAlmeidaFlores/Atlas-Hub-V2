import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, FileCheck2, FileText, Fingerprint, Mail, ShieldCheck } from "lucide-react";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { TERMS_UPDATED_AT } from "@/lib/legal";

interface LegalLink {
  readonly number: string;
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly icon: "terms" | "privacy" | "cookies" | "communications" | "security";
}

const DOCUMENTS: readonly LegalLink[] = [
  {
    number: "01",
    category: "Plataforma",
    title: "Termos de Uso",
    description: "Regras de acesso, responsabilidades e condições gerais para incorporadoras e investidores.",
    href: "/termos",
    icon: "terms",
  },
  {
    number: "02",
    category: "Dados pessoais",
    title: "Política de Privacidade",
    description: "Como coletamos, utilizamos, compartilhamos e protegemos dados pessoais na Atlas Hub.",
    href: "/privacidade",
    icon: "privacy",
  },
  {
    number: "03",
    category: "Navegação",
    title: "Política de Cookies",
    description: "Cookies essenciais, analíticos e de marketing, além de como gerenciar suas preferências.",
    href: "/cookies",
    icon: "cookies",
  },
  {
    number: "04",
    category: "Relacionamento",
    title: "Política de Comunicações",
    description: "Comunicações operacionais, conteúdos, novidades e consentimento para marketing.",
    href: "/comunicacoes",
    icon: "communications",
  },
  {
    number: "05",
    category: "Confiança",
    title: "Segurança da Informação",
    description: "Práticas de proteção, responsabilidades dos usuários e canal para relatar incidentes.",
    href: "/seguranca",
    icon: "security",
  },
];

function DocumentIcon({ type }: { readonly type: LegalLink["icon"] }): ReactNode {
  if (type === "privacy") return <ShieldCheck className="h-5 w-5" strokeWidth={1.7} />;
  if (type === "cookies") return <Fingerprint className="h-5 w-5" strokeWidth={1.7} />;
  if (type === "communications") return <Mail className="h-5 w-5" strokeWidth={1.7} />;
  if (type === "security") return <FileCheck2 className="h-5 w-5" strokeWidth={1.7} />;
  return <FileText className="h-5 w-5" strokeWidth={1.7} />;
}

export default function CentralLegalPage(): ReactNode {
  return (
    <MarketingShell>
      <main>
        <section className="relative overflow-hidden bg-[#001F4E] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(196,144,32,0.22),transparent_32%)]" />
          <div
            className="absolute inset-y-0 right-0 w-1/2 opacity-[0.08]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
            aria-hidden
          />
          <div className="lp-container relative py-14 sm:py-20 lg:py-24">
            <div className="max-w-3xl">
              <span className="inline-flex items-center border border-gold/40 bg-gold/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
                Central Legal
              </span>
              <h1 className="mt-6 text-[38px] font-extrabold uppercase leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-[62px]">
                Clareza para decidir.
                <br />
                <span className="text-gold">Segurança para operar.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-sm font-normal leading-relaxed text-white/70 sm:text-base">
                Reunimos aqui as regras, políticas e compromissos que sustentam a relação entre a Atlas Hub, incorporadoras e investidores.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
                <span>Última atualização: {TERMS_UPDATED_AT}</span>
                <span className="hidden h-1 w-1 rounded-full bg-gold sm:block" />
                <span>{DOCUMENTS.length} documentos</span>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-container -mt-7 relative z-10 pb-16 sm:-mt-8 sm:pb-20">
          <div className="grid gap-4 md:grid-cols-2">
            {DOCUMENTS.map((document) => (
              <Link
                key={document.href}
                to={document.href}
                className="group relative flex min-h-[168px] flex-col justify-between overflow-hidden border border-border bg-card p-5 shadow-[0_8px_24px_rgb(15_23_42/0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-[0_14px_34px_rgb(15_23_42/0.1)] sm:p-6"
              >
                <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center bg-navy-50 text-navy">
                      <DocumentIcon type={document.icon} />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">{document.number} · {document.category}</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold" />
                </div>
                <div className="mt-6">
                  <h2 className="text-xl font-extrabold tracking-tight text-navy">{document.title}</h2>
                  <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-[13px]">{document.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-navy transition-colors group-hover:text-gold">
                    Ler documento <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
            <a
              href="mailto:contato@atlascomp.com.br"
              className="group relative flex min-h-[168px] flex-col justify-between overflow-hidden bg-navy p-5 text-white shadow-[0_8px_24px_rgb(15_23_42/0.12)] transition-colors hover:bg-navy-dark sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-9 w-9 items-center justify-center border border-white/15 bg-white/10 text-gold">
                  <Mail className="h-4 w-4" strokeWidth={1.7} />
                </span>
                <ArrowUpRight className="h-4 w-4 text-white/40 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold" />
              </div>
              <div className="mt-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Fale com a Atlas</p>
                <h2 className="mt-2 text-xl font-extrabold tracking-tight">Dúvidas sobre os documentos?</h2>
                <p className="mt-2 text-xs leading-relaxed text-white/60">Nosso time está disponível para orientar você.</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white group-hover:text-gold">
                  Enviar e-mail <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </a>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
