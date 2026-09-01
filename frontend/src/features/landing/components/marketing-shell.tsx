import { type ReactNode, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { WhatsappFab, WhatsappLink } from "@/components/shared/whatsapp-cta";
import { hasWhatsappSupport } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Investidores", href: "/para-investidores" },
  { label: "Incorporadoras", href: "/para-incorporadoras" },
  { label: "Projetos", href: "/projetos" },
  { label: "Quem somos", href: "/quem-somos" },
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
        "fixed inset-x-0 top-0 z-50 bg-[#F3F3F3] backdrop-blur-sm transition-all duration-300 ease-out",
        scrolled && "shadow-[0_8px_24px_rgba(15,23,42,0.08)]",
      )}
    >
      <div className="lp-container flex h-[72px] items-center justify-between gap-4 sm:h-[84px] sm:gap-6 lg:h-[92px] lg:gap-12">
        <Link to="/" aria-label="Atlas Hub — início" className="shrink-0">
          <Logo size="lg" scheme="light" showIcon={false} className="scale-[0.72] sm:scale-[0.8] lg:scale-[0.85]" />
        </Link>

        <nav className="hidden flex-1 items-center justify-end lg:ml-[15%] lg:flex" aria-label="Principal">
          {NAV.map(({ label, href }, index) => (
            <Link
              key={label}
              to={href}
              className={cn(
                "text-[12px] font-normal tracking-[0.01em] text-[#8E8E93] transition-colors duration-200 hover:text-[#1E1E1E]",
                index > 0 && "ml-5 border-l border-[#8B8B8B]/60 pl-5",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/login"
            className="inline-flex h-[32px] w-[120px] items-center justify-center rounded-[4px] bg-[#D2A047] px-3 text-[12px] font-semibold leading-none text-white transition-opacity duration-200 hover:opacity-90"
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="inline-flex h-[32px] w-[120px] items-center justify-center rounded-[4px] bg-[#076C07] px-3 text-[12px] font-semibold leading-none text-white transition-opacity duration-200 hover:opacity-95"
          >
            Quero Investir
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center lg:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? (
            <X className="h-5 w-5 text-[#1B2B5E]" />
          ) : (
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path
                d="M4.5 18H31.5M4.5 9H31.5M4.5 27H31.5"
                stroke="#D2A047"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-[#D9D9D9] bg-[#F3F3F3] px-6 py-5 lg:hidden">
          <div className="flex flex-col gap-0.5">
            {NAV.map(({ label, href }) => (
              <Link
                key={label}
                to={href}
                onClick={() => setOpen(false)}
                className="px-2 py-3 text-base font-medium text-[#1E1E1E]/70 transition-colors hover:text-[#1E1E1E]"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-2 border-t border-[#D9D9D9] pt-5">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-[4px] bg-[#D2A047] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-[4px] bg-[#076C07] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-95"
            >
              Quero Investir
            </Link>
          </div>
          {hasWhatsappSupport() && (
            <div className="mt-5 border-t border-[#D9D9D9] pt-5">
              <WhatsappLink variant="hero" className="w-full justify-center" />
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function MarketingFooter(): ReactNode {
  return (
    <footer id="contato" className="bg-[#1C2E5E] text-white">
      <div className="lp-container flex flex-col items-center gap-10 py-12 md:grid md:grid-cols-12 md:items-start md:gap-10 md:py-16">
        <div className="flex flex-col items-center text-center md:col-span-4 md:items-start md:text-left">
          <Logo size="lg" scheme="dark" className="origin-center scale-[1.35] md:origin-left md:scale-[1.5] lg:scale-[1.875]" />
          <p className="mt-4 hidden max-w-xs text-[12px] leading-relaxed text-white/70 md:block">
            Crowdfunding imobiliário regulado pela CVM Resolução 88.
            Originação, curadoria e oferta sob a marca Atlas Hub.
          </p>
        </div>
        <div className="w-full md:col-span-8 md:flex md:justify-end">
          <div className="flex w-full flex-col items-center gap-9 text-[11px] md:flex-row md:flex-wrap md:items-start md:justify-end md:gap-8 md:text-[10px] lg:gap-[44.8px] lg:text-[9.6px]">
            <div className="space-y-3 text-center md:space-y-[9.6px] md:text-left">
              <p className="font-semibold text-[#D2A047]">Navegação</p>
              <Link to="/#como-funciona" className="block text-white/80 transition-colors duration-300 hover:text-white md:text-white/70">
                Como Funciona
              </Link>
              <Link to="/para-investidores" className="block text-white/80 transition-colors duration-300 hover:text-white md:text-white/70">
                Para Investidores
              </Link>
              <Link to="/para-incorporadoras" className="block text-white/80 transition-colors duration-300 hover:text-white md:text-white/70">
                Para Incorporadoras
              </Link>
              <Link to="/projetos" className="block text-white/80 transition-colors duration-300 hover:text-white md:text-white/70">
                Projetos
              </Link>
            </div>
            <div className="space-y-3 text-center md:space-y-[9.6px] md:text-left">
              <p className="font-semibold text-[#D2A047]">Institucional</p>
              <Link to="/quem-somos" className="block text-white/80 transition-colors duration-300 hover:text-white md:text-white/70">
                Quem Somos
              </Link>
              <Link to="/#central-duvidas" className="block text-white/80 transition-colors duration-300 hover:text-white md:text-white/70">
                Conteúdos
              </Link>
              <a href="mailto:contato@atlashub.com.br" className="block text-white/80 transition-colors duration-300 hover:text-white md:text-white/70">
                Contato
              </a>
            </div>
            <div className="space-y-3 text-center md:space-y-[9.6px] md:text-left">
              <p className="font-semibold text-[#D2A047]">Legal</p>
              <Link to="/termos" className="block text-white/80 transition-colors duration-300 hover:text-white md:text-white/70">
                Termos de Uso
              </Link>
              <Link to="/privacidade" className="block text-white/80 transition-colors duration-300 hover:text-white md:text-white/70">
                Privacidade
              </Link>
              <a href="#" className="block text-white/80 transition-colors duration-300 hover:text-white md:text-white/70">
                CVM Resolução 88
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 bg-[#D9B366] py-4 text-center md:py-3">
        <div className="lp-container px-4 text-[10px] font-medium leading-relaxed text-[#6C4C14] sm:text-[11px]">
          <div className="md:hidden">
            <p>
              <strong className="font-bold">© 2026 Atlas Hub</strong> — Crowdfunding
            </p>
            <p className="mt-1">
              Imobiliário. <strong className="font-bold">CNPJ:</strong> 68.693.823/0001-83.
            </p>
            <p className="mt-1">
              <strong className="font-bold">Todos os direitos reservados.</strong>
            </p>
          </div>
          <span className="hidden md:inline">
            <strong className="font-bold">© 2026 Atlas Hub</strong> — Crowdfunding Imobiliário.{" "}
            <strong className="font-bold">CNPJ:</strong> 68.693.823/0001-83.{" "}
            <strong className="font-bold">Todos os direitos reservados.</strong>
          </span>
        </div>
      </div>
    </footer>
  );
}

export function MarketingShell({ children }: { readonly children: ReactNode }): ReactNode {
  return (
    <div className={cn("min-h-screen overflow-x-hidden bg-background pt-[72px] text-foreground sm:pt-[84px] lg:pt-[92px]")}>
      <MarketingNavbar />
      {children}
      <MarketingFooter />
      <WhatsappFab />
    </div>
  );
}
