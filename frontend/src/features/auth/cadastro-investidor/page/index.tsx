import { useState, useEffect, type ReactNode, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToastStore } from "@/stores/toast";
import { Mail, Phone, User, Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/features/auth/auth-shell";
import { cn, formatCelular, normalizePhoneDigits } from "@/lib/utils";
import { getApiErrorMessage } from "@/services/api";
import { analytics } from "@/lib/analytics";
import { Checkbox } from "@/components/ui/checkbox";
import { TERMS_VERSION } from "@/lib/legal";
import { USE_LOCAL_MOCKS } from "@/lib/env";

interface FormData {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
}

const INITIAL: FormData = { nome: "", email: "", telefone: "", senha: "", confirmarSenha: "" };

export default function CadastroInvestidorPage(): ReactNode {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [consentimentoMarketing, setConsentimentoMarketing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    analytics.track("form_view", { form: "cadastro_investidor" });
  }, []);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  function f(field: keyof FormData) {
    return (e: ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  function onTelefoneChange(e: ChangeEvent<HTMLInputElement>): void {
    setForm((p) => ({ ...p, telefone: formatCelular(e.target.value) }));
  }

  const nomeValido = form.nome.trim().length >= 3;
  const telefoneDigits = normalizePhoneDigits(form.telefone);
  const telefoneValido = telefoneDigits.length === 10 || telefoneDigits.length === 11;
  const senhaCurta = form.senha.length > 0 && form.senha.length < 8;
  const senhaSemNumero = form.senha.length > 0 && !/[0-9]/.test(form.senha);
  const senhasDiferentes = form.confirmarSenha.length > 0 && form.senha !== form.confirmarSenha;
  const senhaValida = form.senha.length >= 8 && /[0-9]/.test(form.senha) && form.senha === form.confirmarSenha;

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!nomeValido) {
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
    if (form.senha.length < 8) {
      addToast({ type: "error", title: "Senha deve ter no mínimo 8 caracteres" });
      return;
    }
    if (!/[0-9]/.test(form.senha)) {
      addToast({ type: "error", title: "A senha deve conter ao menos 1 número" });
      return;
    }
    if (form.senha !== form.confirmarSenha) {
      addToast({ type: "error", title: "Senhas não conferem" });
      return;
    }
    setIsLoading(true);
    try {
      analytics.track("form_start", { form: "cadastro_investidor" });
      const { signUp } = await import("@aws-amplify/auth");
      const email = form.email.trim().toLowerCase();
      const nome = form.nome.trim();
      const telefone = `+55${telefoneDigits}`;
      if (USE_LOCAL_MOCKS) {
        const now = new Date().toISOString();
        sessionStorage.setItem("atlas.pendingConfirmEmail", email);
        sessionStorage.setItem("atlas.pendingCadastro", JSON.stringify({ tipo: "investidor", nome, telefone, aceiteTermos, consentimentoMarketing }));
        localStorage.setItem(`atlas.mock-investor:${email}`, JSON.stringify({
          nome,
          telefone,
          aceiteTermos,
          consentimentoMarketing,
          termosAceitosEm: now,
          termosVersao: TERMS_VERSION,
        }));
        addToast({ type: "success", title: "Conta criada!", description: "Modo local: confirme com qualquer código de 6 dígitos." });
        navigate(`/confirmar-email?email=${encodeURIComponent(email)}`, { state: { email } });
        return;
      }
      await signUp({
        username: email,
        password: form.senha,
        options: {
          userAttributes: {
            email,
            name: nome,
            phone_number: telefone,
            "custom:tipo": "investidor",
            "custom:termos_aceitos": new Date().toISOString(),
            "custom:termos_versao": TERMS_VERSION,
            "custom:marketing_optin": consentimentoMarketing ? "true" : "false",
          },
        },
      });
      analytics.track("form_submit", { form: "cadastro_investidor" });
      analytics.track("signup", { marketingConsent: consentimentoMarketing });
      sessionStorage.setItem("atlas.pendingConfirmEmail", email);
      sessionStorage.setItem("atlas.pendingCadastro", JSON.stringify({ tipo: "investidor", nome, telefone, aceiteTermos, consentimentoMarketing }));
      addToast({ type: "success", title: "Conta criada!", description: "Verifique seu e-mail para confirmar." });
      navigate(`/confirmar-email?email=${encodeURIComponent(email)}`, { state: { email } });
    } catch (err) {
      addToast({ type: "error", title: "Erro no cadastro", description: getApiErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      audience="investidor"
      title="Criar conta de investidor"
      subtitle="Comece a investir em projetos imobiliários curados pela Atlas Hub"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="form-group">
          <label className="form-label">Nome completo</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input className="field pl-10" placeholder="Seu nome" value={form.nome} onChange={f("nome")} autoComplete="name" required />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="email" className="field pl-10" placeholder="voce@email.com" value={form.email} onChange={f("email")} autoComplete="email" required />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Telefone</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="tel"
              className={cn("field pl-10", form.telefone.length > 0 && !telefoneValido && "field-error")}
              placeholder="(11) 99999-9999"
              value={form.telefone}
              onChange={onTelefoneChange}
              inputMode="numeric"
              autoComplete="tel"
              required
            />
          </div>
          <p className="form-hint">Usaremos o telefone para contato sobre sua conta e oportunidades.</p>
        </div>
        <div className="form-group">
          <label className="form-label">Senha</label>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              className={cn("field pr-10", (senhaCurta || senhaSemNumero) && "field-error")}
              placeholder="Mínimo 8 caracteres, com 1 número"
              value={form.senha}
              onChange={f("senha")}
              required
              minLength={8}
            />
            <button type="button" onClick={() => setShowPwd((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {(senhaCurta || senhaSemNumero) && <p className="form-error">Use no mínimo 8 caracteres e ao menos 1 número</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Confirmar senha</label>
          <div className="relative">
            <input
              type={showConfirmPwd ? "text" : "password"}
              className={cn("field pr-10", senhasDiferentes && "field-error")}
              placeholder="Repita a senha"
              value={form.confirmarSenha}
              onChange={f("confirmarSenha")}
              required
            />
            <button type="button" onClick={() => setShowConfirmPwd((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {senhasDiferentes && <p className="form-error">As senhas não conferem</p>}
        </div>
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-start gap-2.5">
            <Checkbox checked={aceiteTermos} onChange={setAceiteTermos} ariaLabel="Aceitar Termos de Uso e Política de Privacidade" invalid={!aceiteTermos && form.telefone.length > 0} />
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
              Quero receber novidades, conteúdos e oportunidades da Atlas Hub por e-mail e telefone. Posso cancelar quando quiser.
            </p>
          </div>
        </div>
        <button type="submit" disabled={isLoading || !senhaValida || !nomeValido || !telefoneValido || !aceiteTermos} className="btn btn-navy mt-2 w-full">
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white" />
              Criando...
            </>
          ) : (
            "Criar conta"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Já tem conta?{" "}
        <Link to="/investir/login" className="font-semibold text-navy hover:underline">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
