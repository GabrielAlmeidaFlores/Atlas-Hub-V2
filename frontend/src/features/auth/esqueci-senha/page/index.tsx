import { useState, type ReactNode, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, SendHorizonal } from "lucide-react";
import { useToastStore } from "@/stores/toast";
import { AuthShell } from "@/features/auth/auth-shell";

export default function EsqueciSenhaPage(): ReactNode {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { resetPassword } = await import("@aws-amplify/auth");
      await resetPassword({ username: email });
    } catch {
      /* security: always show success */
    } finally {
      setIsLoading(false);
      setSent(true);
      addToast({ type: "success", title: "E-mail enviado!", description: "Verifique sua caixa de entrada." });
    }
  }

  return (
    <AuthShell title="Recuperar senha" subtitle="Informe seu e-mail e enviaremos as instruções.">
      {sent ? (
        <div className="alert alert-success text-center">
          <div className="w-full">
            <p className="text-sm font-bold uppercase tracking-wider text-status-success">Instruções enviadas</p>
            <p className="mt-1 text-xs text-status-success">Se o e-mail estiver cadastrado, você receberá o link em breve.</p>
            <Link to="/login" className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-navy hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="form-group">
            <label className="form-label">E-mail cadastrado</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="email" className="field pl-10" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="btn btn-navy w-full">
            {isLoading ? <><span className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white" />Enviando...</> : <><SendHorizonal className="h-4 w-4" />Enviar instruções</>}
          </button>
          <Link to="/login" className="inline-flex w-full items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-navy">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
