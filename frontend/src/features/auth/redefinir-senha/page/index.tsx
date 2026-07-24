import { useState, type ReactNode, type FormEvent } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useToastStore } from "@/stores/toast";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/features/auth/auth-shell";
import { cn } from "@/lib/utils";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export default function RedefinirSenhaPage(): ReactNode {
  const location = useLocation();
  const state = location.state && typeof location.state === "object" ? (location.state as { email?: string; code?: string }) : {};
  const storedEmail = typeof sessionStorage !== "undefined" ? (sessionStorage.getItem("atlas.resetEmail") ?? "") : "";
  const storedCode = typeof sessionStorage !== "undefined" ? (sessionStorage.getItem("atlas.resetCode") ?? "") : "";

  const email = normalizeEmail(state.email ?? storedEmail);
  const code = (state.code ?? storedCode).replace(/\D/g, "").slice(0, 6);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  const senhaCurta = newPassword.length > 0 && newPassword.length < 8;
  const senhasDiferentes = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const senhaValida = newPassword.length >= 8 && newPassword === confirmPassword && Boolean(/\d/.test(newPassword));

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!email || code.length < 6) {
      addToast({ type: "error", title: "Sessão expirada", description: "Solicite o código novamente." });
      navigate("/esqueci-senha");
      return;
    }
    if (!senhaValida) {
      addToast({ type: "error", title: "Senha inválida", description: "Use no mínimo 8 caracteres, com ao menos 1 número." });
      return;
    }
    setIsLoading(true);
    try {
      const { confirmResetPassword } = await import("@aws-amplify/auth");
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
      sessionStorage.removeItem("atlas.resetEmail");
      sessionStorage.removeItem("atlas.resetCode");
      addToast({ type: "success", title: "Senha redefinida!", description: "Faça login com a nova senha." });
      navigate("/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Código inválido ou expirado";
      const name = err && typeof err === "object" && "name" in err ? String(err.name) : "";
      if (name === "CodeMismatchException" || name === "ExpiredCodeException" || message.toLowerCase().includes("code")) {
        addToast({ type: "error", title: "Código inválido ou expirado", description: "Volte e informe o código novamente." });
        navigate(`/verificar-codigo-senha?email=${encodeURIComponent(email)}`);
        return;
      }
      addToast({ type: "error", title: "Erro", description: message });
    } finally {
      setIsLoading(false);
    }
  }

  if (!email || code.length < 6) {
    return (
      <AuthShell title="Nova senha" subtitle="Solicite um código para continuar.">
        <p className="text-center text-sm text-muted-foreground">Não encontramos um código válido nesta sessão.</p>
        <Link to="/esqueci-senha" className="btn btn-navy mt-6 w-full">
          Recuperar senha
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Nova senha" subtitle="Escolha uma nova senha para acessar a plataforma.">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="form-group">
          <label className="form-label">Nova senha</label>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              className={cn("field pr-10", senhaCurta && "field-error")}
              placeholder="Mínimo 8 caracteres, com número"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowConfirmPwd((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {senhasDiferentes && <p className="form-error">As senhas não conferem</p>}
        </div>
        <button type="submit" disabled={isLoading || !senhaValida} className="btn btn-navy w-full">
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white" />
              Salvando...
            </>
          ) : (
            "Redefinir senha"
          )}
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link to={`/verificar-codigo-senha?email=${encodeURIComponent(email)}`} className="inline-flex text-sm font-medium text-muted-foreground hover:text-navy">
          Voltar
        </Link>
      </div>
    </AuthShell>
  );
}
