import { useState, type ReactNode, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToastStore } from "@/stores/toast";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { AuthShell } from "@/features/auth/auth-shell";

export default function RedefinirSenhaPage(): ReactNode {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { confirmResetPassword } = await import("@aws-amplify/auth");
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
      addToast({ type: "success", title: "Senha redefinida!", description: "Faça login com a nova senha." });
      navigate("/login");
    } catch (err) {
      addToast({ type: "error", title: "Erro", description: err instanceof Error ? err.message : "Código inválido ou expirado" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell title="Nova senha" subtitle="Insira o código recebido e escolha uma nova senha.">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="form-group">
          <label className="form-label">E-mail</label>
          <input type="email" className="field" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Código de verificação</label>
          <input type="text" className="field text-center font-mono tracking-[0.5em]" placeholder="000000" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required />
        </div>
        <div className="form-group">
          <label className="form-label">Nova senha</label>
          <div className="relative">
            <input type={showPwd ? "text" : "password"} className="field pr-10" placeholder="Mínimo 8 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
            <button type="button" onClick={() => setShowPwd((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={isLoading} className="btn btn-navy w-full">
          {isLoading ? <><span className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white" />Salvando...</> : "Redefinir senha"}
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/login" className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-navy">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
        </Link>
      </div>
    </AuthShell>
  );
}
