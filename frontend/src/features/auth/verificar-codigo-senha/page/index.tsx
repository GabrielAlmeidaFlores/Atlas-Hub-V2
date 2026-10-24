import { useState, type ReactNode, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToastStore } from "@/stores/toast";
import { AuthShell } from "@/features/auth/auth-shell";
import { api, getApiErrorMessage } from "@/services/api";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export default function VerificarCodigoSenhaPage(): ReactNode {
  const [searchParams] = useSearchParams();
  const stored = typeof sessionStorage !== "undefined" ? (sessionStorage.getItem("atlas.resetEmail") ?? "") : "";
  const [email, setEmail] = useState(normalizeEmail(searchParams.get("email") ?? stored));
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    const username = normalizeEmail(email);
    if (!username || code.length < 6) return;
    setIsLoading(true);
    try {
      const res = await api.post<{ resetToken: string; needsProfile: boolean; tipo: string | null }>(
        "/publico/auth/reset-validar",
        { email: username, code },
      );
      sessionStorage.setItem("atlas.resetEmail", username);
      sessionStorage.setItem("atlas.resetToken", res.resetToken);
      sessionStorage.setItem("atlas.resetNeedsProfile", res.needsProfile ? "1" : "0");
      if (res.tipo !== null) {
        sessionStorage.setItem("atlas.resetTipo", res.tipo);
      } else {
        sessionStorage.removeItem("atlas.resetTipo");
      }
      navigate("/redefinir-senha", {
        state: { email: username, resetToken: res.resetToken, needsProfile: res.needsProfile, tipo: res.tipo },
      });
    } catch (err) {
      addToast({ type: "error", title: "Não foi possível validar", description: getApiErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend(): Promise<void> {
    const username = normalizeEmail(email);
    if (!username) {
      addToast({ type: "error", title: "Informe o e-mail" });
      return;
    }
    setIsResending(true);
    try {
      await api.post("/publico/auth/reset-solicitar", { email: username });
      addToast({ type: "success", title: "Novo código enviado", description: "Verifique sua caixa de entrada e o spam." });
    } catch (err) {
      addToast({ type: "error", title: "Não foi possível reenviar", description: getApiErrorMessage(err) });
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthShell title="Código de verificação" subtitle="Digite o código de 6 dígitos enviado para o seu e-mail.">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="form-group">
          <label className="form-label">E-mail</label>
          <input
            type="email"
            className="field"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Código de verificação</label>
          <input
            type="text"
            className="field text-center font-mono text-xl tracking-[0.5em]"
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
          <p className="form-hint text-center">O código foi enviado por e-mail</p>
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={isResending || !email.trim()}
              className="text-xs font-medium text-navy hover:underline disabled:opacity-50"
            >
              {isResending ? "Reenviando..." : "Reenviar código"}
            </button>
          </div>
        </div>
        <button type="submit" disabled={isLoading || code.length < 6} className="btn btn-navy w-full">
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white" />
              Validando...
            </>
          ) : (
            "Continuar"
          )}
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/esqueci-senha" className="inline-flex text-sm font-medium text-muted-foreground hover:text-navy">
          Voltar
        </Link>
      </div>
    </AuthShell>
  );
}
