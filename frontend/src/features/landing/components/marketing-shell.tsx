import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { WhatsappFab, WhatsappLink } from "@/components/shared/whatsapp-cta";
import { hasWhatsappSupport } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Incorporadoras", href: "/para-incorporadoras" },
  { label: "Investidores", href: "/para-investidores" },
] as const;

function MarketingNavbar(): ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-white/10 bg-navy-dark/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <Link to="/" aria-label="Atlas Hub — início">
          <Logo size="md" scheme="dark" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map(({ label, href }) => (
            <Link
              key={label}
              to={href}
              className="text-[11px] font-bold uppercase tracking-wider text-white/65 transition-colors hover:text-white"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="text-[11px] font-bold uppercase tracking-wider text-white/70 hover:text-white">Entrar</Link>
          <Link to="/cadastro" className="btn btn-gold btn-lp text-[11px] uppercase tracking-wider">Cadastrar</Link>
        </div>
        <button type="button" onClick={() => setOpen((p) => !p)} className="border border-white/20 p-1.5 text-white md:hidden" aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-white/10 bg-navy-dark px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map(({ label, href }) => (
              <Link
                key={label}
                to={href}
                onClick={() => setOpen(false)}
                className="px-2 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/70 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
            <Link to="/login" onClick={() => setOpen(false)} className="btn btn-outline w-full justify-center border-white/20 text-white">Entrar</Link>
            <Link to="/cadastro" onClick={() => setOpen(false)} className="btn btn-gold w-full justify-center">Cadastrar incorporadora</Link>
            {hasWhatsappSupport() && (
              <WhatsappLink variant="hero" className="w-full justify-center" />
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MarketingFooter(): ReactNode {
  return (
    <footer id="contato" className="border-t border-border bg-navy-dark py-12 text-white/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <Logo size="sm" scheme="dark" />
          <p className="mt-3 max-w-xs text-xs leading-relaxed">Crowdfunding imobiliário regulado pela CVM Resolução 88.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-[10px] font-bold uppercase tracking-widest sm:grid-cols-3">
          <div className="space-y-2">
            <p className="text-white/80">Produto</p>
            <Link to="/#como-funciona" className="block hover:text-white">Como funciona</Link>
            <Link to="/para-incorporadoras" className="block hover:text-white">Incorporadoras</Link>
            <Link to="/para-investidores" className="block hover:text-white">Investidores</Link>
          </div>
          <div className="space-y-2">
            <p className="text-white/80">Acesso</p>
            <Link to="/cadastro" className="block hover:text-white">Cadastrar</Link>
            <Link to="/login" className="block hover:text-white">Entrar</Link>
          </div>
          <div className="space-y-2">
            <p className="text-white/80">Contato</p>
            <a href="mailto:contato@atlashub.com.br" className="block hover:text-white">contato@atlashub.com.br</a>
            <WhatsappLink variant="text" className="text-white/50">WhatsApp suporte</WhatsappLink>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 px-6 pt-6 text-[10px] font-bold uppercase tracking-widest">
        © 2026 Atlas Hub
      </div>
    </footer>
  );
}

function MobileCtaBar(): ReactNode {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl gap-2">
        <Link to="/cadastro" className="btn btn-gold flex-1 justify-center text-[11px] uppercase tracking-wider">
          Cadastrar
        </Link>
        {hasWhatsappSupport() ? (
          <WhatsappLink variant="navy" className="flex-1 justify-center text-[11px] uppercase tracking-wider !py-2.5">
            WhatsApp
          </WhatsappLink>
        ) : (
          <Link to="/login" className="btn btn-outline flex-1 justify-center text-[11px] uppercase tracking-wider">
            Entrar
          </Link>
        )}
      </div>
    </div>
  );
}

export function MarketingShell({ children }: { readonly children: ReactNode }): ReactNode {
  return (
    <div className={cn("min-h-screen bg-background text-foreground")}>
      <MarketingNavbar />
      {children}
      <MarketingFooter />
      <div className="h-16 md:hidden" />
      <MobileCtaBar />
      <WhatsappFab />
    </div>
  );
}
