import type { ReactNode } from "react";
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
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--navy) 1px, transparent 1px), linear-gradient(90deg, var(--navy) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-navy-dark p-10 lg:flex xl:w-[40%]">
        <div className="pointer-events-none absolute inset-0">
          <div className="lp-float absolute -left-16 -top-16 h-72 w-72   opacity-30 blur-[90px]" style={{ background: "radial-gradient(circle, #1B2B5E, transparent)" }} />
          <div className="absolute bottom-0 right-0 h-56 w-56   opacity-20 blur-[70px]" style={{ background: "radial-gradient(circle, #C49020, transparent)" }} />
        </div>

        <div className="relative">
          <Logo size="md" scheme="dark" />
        </div>

        <div className="relative">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gold">Atlas Hub</p>
          <h2 className="text-3xl font-extrabold leading-tight text-white xl:text-4xl">
            Construa sem banco.
            <br />
            <span className="text-gradient-gold">Capte com investidores.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/50">
            Crowdfunding imobiliário regulado pela CVM Resolução 88.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-0 border border-white/10">
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

        <p className="relative text-[10px] font-bold uppercase tracking-widest text-white/25">
          © 2026 Atlas Hub · CVM Resolução 88
        </p>
      </div>

      <div className="relative flex flex-1 flex-col justify-center px-5 py-12 sm:px-8 lg:px-12">
        <div className="mb-8 lg:hidden">
          <Logo size="md" />
        </div>
        <div className="mx-auto w-full max-w-md border border-border bg-card p-6 sm:p-8">
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
