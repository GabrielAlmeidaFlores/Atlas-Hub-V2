import { useEffect, useRef, useState, type ReactNode, type FormEvent, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { CircleUserRound, Mail, Phone, KeyRound } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { getApiErrorMessage } from "@/services/api";
import { cn, formatCelular, normalizePhoneDigits } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { TERMS_VERSION } from "@/lib/legal";
import { USE_LOCAL_MOCKS } from "@/lib/env";

export default function InvestidorPerfilPage(): ReactNode {
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);
  const [nome, setNome] = useState(user?.nome ?? "");
  const [telefone, setTelefone] = useState("");
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [consentimentoMarketing, setConsentimentoMarketing] = useState(false);
  const [termosAceitosEm, setTermosAceitosEm] = useState<string | null>(null);
  const [termosVersao, setTermosVersao] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const phoneTouched = useRef(false);
  const telefoneDigits = normalizePhoneDigits(telefone);
  const telefoneValido = telefoneDigits.length === 10 || telefoneDigits.length === 11;

  useEffect(() => {
    let cancelled = false;
    if (USE_LOCAL_MOCKS) {
      const raw = user?.email ? localStorage.getItem(`atlas.mock-investor:${user.email}`) : null;
      if (raw !== null) {
        try {
          const stored = JSON.parse(raw) as {
            nome?: string;
            telefone?: string;
            aceiteTermos?: boolean;
            consentimentoMarketing?: boolean;
            termosAceitosEm?: string;
            termosVersao?: string;
          };
          setNome(stored.nome ?? user?.nome ?? "");
          setTelefone(formatCelular(normalizePhoneDigits(stored.telefone ?? "")));
          setAceiteTermos(stored.aceiteTermos === true && stored.termosVersao === TERMS_VERSION);
          setConsentimentoMarketing(stored.consentimentoMarketing === true);
          setTermosAceitosEm(stored.termosAceitosEm ?? null);
          setTermosVersao(stored.termosVersao ?? null);
        } catch {
          return;
        }
      }
      return;
    }
    void import("@aws-amplify/auth").then(async ({ fetchUserAttributes }) => {
      try {
        const attrs = await fetchUserAttributes();
        if (cancelled) return;
        const rawPhone = normalizePhoneDigits(attrs["phone_number"] ?? "");
        if (!phoneTouched.current) setTelefone(formatCelular(rawPhone));
        const acceptedAt = attrs["custom:termos_aceitos"] ?? null;
        const version = attrs["custom:termos_versao"] ?? null;
        setTermosAceitosEm(acceptedAt);
        setTermosVersao(version);
        setAceiteTermos(acceptedAt !== null && version === TERMS_VERSION);
        setConsentimentoMarketing(attrs["custom:marketing_optin"] === "true");
      } catch {
        return;
      }
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  function onTelefoneChange(e: ChangeEvent<HTMLInputElement>): void {
    phoneTouched.current = true;
    setTelefone(formatCelular(e.target.value));
  }

  async function handleSave(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (nome.trim().length < 3) {
      addToast({ type: "error", title: "Informe seu nome completo" });
      return;
    }
    if (!telefoneValido) {
      addToast({ type: "error", title: "Informe um telefone válido com DDD" });
      return;
    }
    if (!aceiteTermos) {
      addToast({ type: "error", title: "Aceite os Termos de Uso e a Política de Privacidade" });
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (USE_LOCAL_MOCKS) {
        const acceptedAt = termosVersao === TERMS_VERSION && termosAceitosEm !== null ? termosAceitosEm : now;
        localStorage.setItem(`atlas.mock-investor:${user?.email ?? ""}`, JSON.stringify({
          nome: nome.trim(),
          telefone: `+55${telefoneDigits}`,
          aceiteTermos: true,
          consentimentoMarketing,
          termosAceitosEm: acceptedAt,
          termosVersao: TERMS_VERSION,
        }));
        setTermosAceitosEm(acceptedAt);
        setTermosVersao(TERMS_VERSION);
        phoneTouched.current = false;
        addToast({ type: "success", title: "Perfil atualizado" });
        return;
      }
      const { updateUserAttributes } = await import("@aws-amplify/auth");
      const acceptedAt = termosVersao === TERMS_VERSION && termosAceitosEm !== null ? termosAceitosEm : now;
      await updateUserAttributes({
        userAttributes: {
          name: nome.trim(),
          phone_number: `+55${telefoneDigits}`,
          "custom:termos_aceitos": acceptedAt,
          "custom:termos_versao": TERMS_VERSION,
          "custom:marketing_optin": consentimentoMarketing ? "true" : "false",
        },
      });
      setTermosAceitosEm(acceptedAt);
      setTermosVersao(TERMS_VERSION);
      phoneTouched.current = false;
      addToast({ type: "success", title: "Perfil atualizado" });
    } catch (err) {
      addToast({ type: "error", title: "Não foi possível salvar", description: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  const display = nome.trim().length > 0 ? nome.trim() : user?.email ?? "Investidor";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-lg font-extrabold uppercase tracking-wide text-foreground">Perfil</h1>
      <p className="mt-1 text-sm text-muted-foreground">Seus dados de acesso na Atlas Hub.</p>

      <div className="mt-6 rounded-[12px] border border-border bg-card">
        <div className="flex items-center gap-4 border-b border-border p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] bg-navy text-xl font-extrabold text-white">
            {display.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-foreground">{display}</p>
            <p className="text-xs text-muted-foreground">Investidor · Conta Atlas Hub</p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSave(e)} className="space-y-4 p-6">
          <div className="form-group">
            <label className="form-label">Nome completo</label>
            <div className="relative">
              <CircleUserRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="field pl-10"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="name"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className="field pl-10" value={user?.email ?? ""} disabled />
            </div>
            <p className="form-hint">O e-mail de acesso não pode ser alterado por aqui.</p>
          </div>
          <div className="form-group">
            <label className="form-label">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                className={cn("field pl-10", telefone.length > 0 && !telefoneValido && "field-error")}
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={onTelefoneChange}
                inputMode="numeric"
                autoComplete="tel"
                required
              />
            </div>
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-start gap-2.5">
              <Checkbox checked={aceiteTermos} onChange={setAceiteTermos} ariaLabel="Aceitar Termos de Uso e Política de Privacidade" invalid={!aceiteTermos} />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Li e aceito os{" "}
                <Link to="/termos" target="_blank" className="font-semibold text-navy hover:underline">Termos de Uso</Link>
                {" "}e a{" "}
                <Link to="/privacidade" target="_blank" className="font-semibold text-navy hover:underline">Política de Privacidade</Link>.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Checkbox checked={consentimentoMarketing} onChange={setConsentimentoMarketing} ariaLabel="Consentir com comunicações de marketing" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Quero receber novidades, conteúdos e oportunidades da Atlas Hub por e-mail e telefone.
              </p>
            </div>
          </div>
          <button type="submit" disabled={saving || !telefoneValido || !aceiteTermos} className="btn btn-navy">
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>

        <div className="flex items-center justify-between gap-4 border-t border-border p-6">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-navy" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-semibold text-foreground">Senha</p>
              <p className="text-xs text-muted-foreground">Altere sua senha de acesso.</p>
            </div>
          </div>
          <Link to="/investir/senha" className="btn btn-outline btn-sm shrink-0">
            Alterar senha
          </Link>
        </div>
      </div>
    </div>
  );
}
