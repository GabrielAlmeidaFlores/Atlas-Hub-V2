import { useState, type ReactNode, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { getApiErrorMessage } from "@/services/api";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { AuthShell } from "@/features/auth/auth-shell";
import { homeForPerfil } from "@/lib/perfil";
import { analytics } from "@/lib/analytics";

type Audience = "incorporadora" | "investidor";

export default function LoginPage({ audience = "incorporadora" }: { readonly audience?: Audience }): ReactNode {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [showNew, setShowNew] = useState(false);

  const { login, pendingChallenge, handleNewPasswordRequired } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user?.id !== undefined) analytics.identify(user.id);
      analytics.track("login");
      navigate(homeForPerfil(user?.perfil));
    } catch (err) {
      addToast({ type: "error", title: "Credenciais inválidas", description: getApiErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleNewPass(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    try {
      await handleNewPasswordRequired(newPwd);
      const user = useAuthStore.getState().user;
      if (user?.id !== undefined) analytics.identify(user.id);
      analytics.track("login");
      navigate(homeForPerfil(user?.perfil));
    } catch (err) {
      addToast({ type: "error", title: "Erro", description: getApiErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  if (pendingChallenge?.type === "NEW_PASSWORD_REQUIRED") {
    return (
      <AuthShell audience={audience} title="Defina sua senha" subtitle="Primeiro acesso — crie uma senha segura para continuar.">
        <form onSubmit={(e) => void handleNewPass(e)} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Nova senha</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                required
                minLength={8}
                className="field pr-11"
                placeholder="Mínimo 8 caracteres"
              />
              <button type="button" onClick={() => setShowNew((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-navy w-full">
            {loading ? (
              <span className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <ArrowRight className="h-4 w-4" /> Definir senha e entrar
              </>
            )}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell audience={audience} title={audience === "investidor" ? "Acesse sua conta" : "Bem-vindo de volta"} subtitle={audience === "investidor" ? "Entre para ver os projetos disponíveis para investimento." : "Entre com suas credenciais para acessar a plataforma."}>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="form-group">
          <label className="form-label">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="field pl-10"
              placeholder="seu@email.com.br"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Senha</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="field px-10"
              placeholder="Sua senha"
            />
            <button type="button" onClick={() => setShowPwd((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link to="/esqueci-senha" className="text-xs font-medium text-navy hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <button type="submit" disabled={loading} className="btn btn-navy w-full">
          {loading ? (
            <span className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white" />
          ) : (
            "Entrar na plataforma"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {audience === "investidor" ? (
          <>
            Ainda não tem conta?{" "}
            <Link to="/investir/cadastro" className="font-semibold text-navy hover:underline">
              Criar conta de investidor
            </Link>
          </>
        ) : (
          <>
            Incorporadora sem conta?{" "}
            <Link to="/cadastro" className="font-semibold text-navy hover:underline">
              Criar conta
            </Link>
          </>
        )}
      </p>
    </AuthShell>
  );
}
