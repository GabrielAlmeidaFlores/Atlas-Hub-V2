import { useState, type ReactNode, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToastStore } from "@/stores/toast";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6FA] p-4 sm:p-8">
      <div className="w-full max-w-sm animate-in">
        <div className="mb-6 flex justify-center">
          <img src="/atlas-logo.png" alt="Atlas Hub" className="h-7 object-contain" />
        </div>
        <div className="card p-6 sm:p-8">
          <div className="mb-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50">
              <Lock className="h-5 w-5 text-navy" />
            </div>
            <h1 className="text-xl font-bold text-[#111827]">Nova senha</h1>
            <p className="mt-1 text-sm text-[#6B7280]">Insira o código recebido e escolha uma nova senha</p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input type="email" className="input-base" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Código de verificação</label>
              <input type="text" className="input-base text-center font-mono tracking-[0.5em]" placeholder="000000" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Nova senha</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} className="input-base pr-10" placeholder="Mínimo 8 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
                <button type="button" onClick={() => setShowPwd((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
              {isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Salvando...</> : "Redefinir senha"}
            </button>
          </form>
        </div>

        <div className="mt-4 text-center">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-navy">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
