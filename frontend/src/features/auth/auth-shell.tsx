import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Building2, TrendingUp, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/logo";

interface AuthShellProps {
  readonly children: ReactNode;
  readonly title: string;
  readonly subtitle: string;
}

export function AuthShell({ children, title, subtitle }: AuthShellProps): ReactNode {
  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-navy-dark p-10 lg:flex xl:w-[40%]">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/auth-bg.jpg')" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(165deg, rgb(10 18 36 / 0.82) 0%, rgb(15 26 58 / 0.72) 45%, rgb(10 18 36 / 0.88) 100%)",
          }}
          aria-hidden
        />

        <div className="relative">
          <Link to="/" aria-label="Atlas Hub — início">
            <Logo size="md" scheme="dark" />
          </Link>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-extrabold leading-tight text-white xl:text-4xl">
            Construa sem banco.
            <br />
            <span className="text-gradient-gold">Capte com investidores.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            Crowdfunding imobiliário regulado pela CVM Resolução 88.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-0 border border-white/10 bg-white/[0.04] backdrop-blur-sm">
            {[
              { icon: Building2, label: "Incorporadoras" },
              { icon: TrendingUp, label: "Rentabilidade" },
              { icon: ShieldCheck, label: "CVM 88" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="border-r border-white/10 p-4 text-center last:border-r-0">
                <Icon className="mx-auto mb-2 h-4 w-4 text-gold" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/45">
          © 2026 Atlas Hub - Crowdfunding Imobiliário. Todos os direitos reservados.
        </p>
      </div>

      <div className="relative flex flex-1 flex-col justify-center px-5 py-12 sm:px-8 lg:px-12">
        <div className="mb-8 lg:hidden">
          <Link to="/" aria-label="Atlas Hub — início">
            <Logo size="md" />
          </Link>
        </div>
        <div className="mx-auto w-full max-w-md rounded-[8px] border border-border bg-card p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">{title}</h1>
            <p className="mt-1.5 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
