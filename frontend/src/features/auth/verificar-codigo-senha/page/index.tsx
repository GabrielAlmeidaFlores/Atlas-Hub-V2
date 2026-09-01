import { useState, type ReactNode, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToastStore } from "@/stores/toast";
import { AuthShell } from "@/features/auth/auth-shell";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isInvalidPasswordError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = "name" in err ? String(err.name) : "";
  const message = err instanceof Error ? err.message : "";
  return (
    name === "InvalidPasswordException" ||
    message.includes("Password did not conform") ||
    message.includes("Password does not conform") ||
    (message.includes("password") && message.includes("policy")) ||
    message.includes("RequireNumbers") ||
    message.includes("PasswordPolicy")
  );
}

function isBadCodeError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = "name" in err ? String(err.name) : "";
  const message = err instanceof Error ? err.message.toLowerCase() : "";
  return (
    name === "CodeMismatchException" ||
    name === "ExpiredCodeException" ||
    message.includes("invalid verification code") ||
    message.includes("invalid code") ||
    message.includes("expired")
  );
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
      const { confirmResetPassword } = await import("@aws-amplify/auth");
      await confirmResetPassword({
        username,
        confirmationCode: code,
        newPassword: "abcdefgh",
      });
      addToast({ type: "error", title: "Não foi possível validar o código" });
    } catch (err) {
      if (isInvalidPasswordError(err)) {
        sessionStorage.setItem("atlas.resetEmail", username);
        sessionStorage.setItem("atlas.resetCode", code);
        navigate("/redefinir-senha", { state: { email: username, code } });
        return;
      }
      if (isBadCodeError(err)) {
        addToast({ type: "error", title: "Código inválido", description: "Confira o código do e-mail ou solicite um novo." });
        return;
      }
      addToast({ type: "error", title: "Não foi possível validar", description: err instanceof Error ? err.message : "Tente novamente" });
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
      const { resetPassword } = await import("@aws-amplify/auth");
      await resetPassword({ username });
      addToast({ type: "success", title: "Novo código enviado", description: "Verifique sua caixa de entrada e o spam." });
    } catch {
      addToast({ type: "success", title: "Novo código enviado", description: "Se o e-mail estiver cadastrado, você receberá o código em breve." });
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
