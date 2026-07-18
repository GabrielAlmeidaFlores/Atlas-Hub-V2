import { useState, type ReactNode, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useToastStore } from "@/stores/toast";
import { AuthShell } from "@/features/auth/auth-shell";

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
      <AuthShell title="E-mail confirmado" subtitle="Sua conta foi ativada com sucesso.">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-status-success-subtle">
            <CheckCircle className="h-6 w-6 text-status-success" />
          </div>
          <p className="text-xs text-muted-foreground">Agora você pode fazer login na plataforma.</p>
          <button type="button" onClick={() => navigate("/login")} className="btn btn-navy mt-6 w-full">
            Ir para o login
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Confirme seu e-mail" subtitle="Insira o código de 6 dígitos enviado para o seu e-mail.">
      <form onSubmit={(e) => void handleConfirm(e)} className="space-y-4">
        <div className="form-group">
          <label className="form-label">E-mail</label>
          <input type="email" className="field" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Código de verificação</label>
          <input
            type="text"
            className="field text-center font-mono text-xl tracking-[0.5em]"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
          />
          <p className="form-hint text-center">O código expira em 24 horas</p>
        </div>
        <button type="submit" disabled={isLoading || code.length < 6} className="btn btn-navy w-full">
          {isLoading ? <><span className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white" />Confirmando...</> : "Confirmar e-mail"}
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
