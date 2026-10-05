import { useState, useEffect, type ReactNode, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToastStore } from "@/stores/toast";
import { Mail, User, Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/features/auth/auth-shell";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";

interface FormData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

const INITIAL: FormData = { nome: "", email: "", senha: "", confirmarSenha: "" };

export default function CadastroInvestidorPage(): ReactNode {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
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

  const nomeValido = form.nome.trim().length >= 3;
  const senhaCurta = form.senha.length > 0 && form.senha.length < 8;
  const senhasDiferentes = form.confirmarSenha.length > 0 && form.senha !== form.confirmarSenha;
  const senhaValida = form.senha.length >= 8 && form.senha === form.confirmarSenha;

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!nomeValido) {
      addToast({ type: "error", title: "Informe seu nome completo" });
      return;
    }
    if (form.senha.length < 8) {
      addToast({ type: "error", title: "Senha deve ter no mínimo 8 caracteres" });
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
      await signUp({ username: email, password: form.senha, options: { userAttributes: { email, name: nome } } });
      analytics.track("form_submit", { form: "cadastro_investidor" });
      analytics.track("signup");
      sessionStorage.setItem("atlas.pendingConfirmEmail", email);
      sessionStorage.setItem("atlas.pendingCadastro", JSON.stringify({ tipo: "investidor", nome }));
      addToast({ type: "success", title: "Conta criada!", description: "Verifique seu e-mail para confirmar." });
      navigate(`/confirmar-email?email=${encodeURIComponent(email)}`, { state: { email } });
    } catch (err) {
      addToast({ type: "error", title: "Erro no cadastro", description: err instanceof Error ? err.message : "Tente novamente" });
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
          <label className="form-label">Senha</label>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              className={cn("field pr-10", senhaCurta && "field-error")}
              placeholder="Mínimo 8 caracteres"
              value={form.senha}
              onChange={f("senha")}
              required
              minLength={8}
            />
            <button type="button" onClick={() => setShowPwd((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {senhaCurta && <p className="form-error">A senha deve ter no mínimo 8 caracteres</p>}
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
        <button type="submit" disabled={isLoading || !senhaValida || !nomeValido} className="btn btn-navy mt-2 w-full">
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
