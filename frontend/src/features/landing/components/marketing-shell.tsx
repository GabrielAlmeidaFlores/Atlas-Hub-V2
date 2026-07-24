import { type ReactNode, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Mail } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { WhatsappFab, WhatsappLink } from "@/components/shared/whatsapp-cta";
import { hasWhatsappSupport } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Incorporadoras", href: "/para-incorporadoras" },
  { label: "Investidores", href: "/para-investidores" },
  { label: "FAQ", href: "/#faq" },
] as const;

function MarketingNavbar(): ReactNode {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => {
      setScrolled(window.scrollY > 48);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return (): void => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onResize = (): void => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return (): void => {
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 ease-out",
        scrolled
          ? "border-white/10 bg-navy-dark/90 shadow-[0_10px_40px_rgb(15_26_58/0.35)]"
          : "border-white/[0.08] bg-white/[0.07] shadow-none",
      )}
    >
      <div className="lp-container flex h-16 items-center justify-between lg:h-[4.25rem]">
        <Link to="/" aria-label="Atlas Hub — início" className="shrink-0">
          <Logo size="md" scheme="dark" />
        </Link>
        <nav className="hidden items-center gap-9 lg:flex" aria-label="Principal">
          {NAV.map(({ label, href }) => (
            <Link
              key={label}
              to={href}
              className="text-sm font-medium text-white/65 transition-colors duration-300 hover:text-white"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <Link
            to="/login"
            className="text-sm font-medium text-white/70 transition-colors duration-300 hover:text-white"
          >
            Entrar
          </Link>
          <Link to="/cadastro" className="btn btn-gold btn-lp text-sm font-semibold">
            Cadastrar
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="rounded-[8px] border border-white/20 p-2 text-white transition-colors duration-300 hover:bg-white/5 lg:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div
          className={cn(
            "border-t border-white/10 px-6 py-5 backdrop-blur-xl transition-colors duration-300 lg:hidden",
            scrolled ? "bg-navy-dark/95" : "bg-navy-dark/90",
          )}
        >
          <div className="flex flex-col gap-0.5">
            {NAV.map(({ label, href }) => (
              <Link
                key={label}
                to={href}
                onClick={() => setOpen(false)}
                className="px-2 py-3 text-sm font-medium text-white/70 transition-colors hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-5">
            <Link to="/login" onClick={() => setOpen(false)} className="btn btn-on-dark w-full justify-center">
              Entrar
            </Link>
            <Link to="/cadastro" onClick={() => setOpen(false)} className="btn btn-gold w-full justify-center">
              Cadastrar incorporadora
            </Link>
            {hasWhatsappSupport() && <WhatsappLink variant="hero" className="w-full justify-center" />}
          </div>
        </div>
      )}
    </header>
  );
}

function MarketingFooter(): ReactNode {
  return (
    <footer id="contato" className="border-t border-white/10 bg-navy-dark text-white/50">
      <div className="lp-container grid gap-12 py-16 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5 lg:col-span-4">
          <Logo size="lg" scheme="dark" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/45">
            Crowdfunding imobiliário regulado pela CVM Resolução 88. Originação, curadoria e oferta sob a marca Atlas Hub.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm font-medium sm:grid-cols-3 md:col-span-7 md:grid-cols-3 lg:col-span-8 lg:pl-8">
          <div className="space-y-3">
            <p className="font-semibold text-white/85">Produto</p>
            <Link to="/#como-funciona" className="block text-white/45 transition-colors duration-300 hover:text-white">
              Como funciona
            </Link>
            <Link to="/para-incorporadoras" className="block text-white/45 transition-colors duration-300 hover:text-white">
              Incorporadoras
            </Link>
            <Link to="/para-investidores" className="block text-white/45 transition-colors duration-300 hover:text-white">
              Investidores
            </Link>
            <Link to="/#faq" className="block text-white/45 transition-colors duration-300 hover:text-white">
              FAQ
            </Link>
          </div>
          <div className="space-y-3">
            <p className="font-semibold text-white/85">Acesso</p>
            <Link to="/cadastro" className="block text-white/45 transition-colors duration-300 hover:text-white">
              Cadastrar
            </Link>
            <Link to="/login" className="block text-white/45 transition-colors duration-300 hover:text-white">
              Entrar
            </Link>
          </div>
          <div className="space-y-3">
            <p className="font-semibold text-white/85">Contato</p>
            <a
              href="mailto:contato@atlashub.com.br"
              className="inline-flex max-w-full items-start gap-2 text-gold transition-opacity duration-300 hover:opacity-80"
            >
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0 break-all">contato@atlashub.com.br</span>
            </a>
            <WhatsappLink variant="text" className="text-white/45">
              WhatsApp suporte
            </WhatsappLink>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="lp-container flex flex-col gap-2 py-6 text-sm text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Atlas Hub - Crowdfunding Imobiliário. Todos os direitos reservados.</span>
          <span>CVM Resolução 88</span>
        </div>
      </div>
    </footer>
  );
}

function MobileCtaBar(): ReactNode {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-7xl gap-2">
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
