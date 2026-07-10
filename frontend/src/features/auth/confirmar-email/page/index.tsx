import { useState, type ReactNode, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useToastStore } from "@/stores/toast";

export default function ConfirmarEmailPage(): ReactNode {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  async function handleConfirm(e: FormEvent): Promise<void> {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { confirmSignUp } = await import("@aws-amplify/auth");
      await confirmSignUp({ username: email, confirmationCode: code });
      setDone(true);
    } catch (err) {
      addToast({ type: "error", title: "Código inválido", description: err instanceof Error ? err.message : "Tente novamente" });
    } finally {
      setIsLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6FA] p-4 sm:p-8">
        <div className="w-full max-w-sm animate-in text-center">
          <div className="card p-6 sm:p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-[#111827]">E-mail confirmado!</h1>
            <p className="mt-2 text-sm text-[#6B7280]">Sua conta foi ativada com sucesso. Agora você pode fazer login.</p>
            <button type="button" onClick={() => navigate("/login")} className="btn btn-primary w-full mt-6">
              Ir para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6FA] p-4 sm:p-8">
      <div className="w-full max-w-sm animate-in">
        <div className="mb-6 flex justify-center">
          <img src="/atlas-logo.png" alt="Atlas Hub" className="h-7 object-contain" />
        </div>
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50">
              <Mail className="h-6 w-6 text-navy" />
            </div>
            <h1 className="text-xl font-bold text-[#111827]">Confirme seu e-mail</h1>
            <p className="mt-2 text-sm text-[#6B7280]">Insira o código de 6 dígitos enviado para o seu e-mail</p>
          </div>

          <form onSubmit={(e) => void handleConfirm(e)} className="space-y-4">
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input type="email" className="input-base" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Código de verificação</label>
              <input
                type="text" className="input-base text-center text-xl font-mono tracking-[0.5em]"
                placeholder="000000" maxLength={6} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required
              />
              <p className="form-hint text-center">O código expira em 24 horas</p>
            </div>
            <button type="submit" disabled={isLoading || code.length < 6} className="btn btn-primary w-full">
              {isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Confirmando...</> : "Confirmar e-mail"}
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
