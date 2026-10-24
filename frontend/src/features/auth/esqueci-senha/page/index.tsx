import { useState, type ReactNode, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { useToastStore } from "@/stores/toast";
import { AuthShell } from "@/features/auth/auth-shell";
import { api, getApiErrorMessage } from "@/services/api";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export default function EsqueciSenhaPage(): ReactNode {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    const username = normalizeEmail(email);
    setIsLoading(true);
    try {
      await api.post("/publico/auth/reset-solicitar", { email: username });
      const { analytics } = await import("@/lib/analytics");
      analytics.track("password_recovery");
      sessionStorage.setItem("atlas.resetEmail", username);
      addToast({ type: "success", title: "Código enviado", description: "Se o e-mail estiver cadastrado, você receberá o código em breve." });
      navigate(`/verificar-codigo-senha?email=${encodeURIComponent(username)}`);
    } catch (err) {
      addToast({ type: "error", title: "Não foi possível enviar", description: getApiErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell title="Recuperar senha" subtitle="Informe seu e-mail e enviaremos um código de verificação.">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="form-group">
          <label className="form-label">E-mail cadastrado</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="email" className="field pl-10" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
        </div>
        <button type="submit" disabled={isLoading} className="btn btn-navy w-full">
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white" />
              Enviando...
            </>
          ) : (
            "Enviar código"
          )}
        </button>
        <Link to="/login" className="inline-flex w-full items-center justify-center text-sm font-medium text-muted-foreground hover:text-navy">
          Voltar para o login
        </Link>
      </form>
    </AuthShell>
  );
}
