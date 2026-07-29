import { useState, type ReactNode, type FormEvent } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { useToastStore } from "@/stores/toast";
import { AuthShell } from "@/features/auth/auth-shell";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function confirmErrorMessage(err: unknown): string {
  const name = err && typeof err === "object" && "name" in err ? String(err.name) : "";
  const message = err instanceof Error ? err.message : "";
  if (name === "CodeMismatchException" || message.includes("Invalid code")) {
    return "Código inválido. Confira o e-mail usado no cadastro ou solicite um novo código.";
  }
  if (name === "ExpiredCodeException" || message.includes("expired")) {
    return "Código expirado. Solicite um novo código.";
  }
  if (name === "UserNotFoundException") {
    return "Conta não encontrada para este e-mail.";
  }
  if (name === "NotAuthorizedException" && message.toLowerCase().includes("confirmed")) {
    return "Este e-mail já foi confirmado. Faça login.";
  }
  if (message.includes("PostConfirmation") || message.includes("secondary index")) {
    return "Falha ao criar o perfil da incorporadora. Tente confirmar novamente em instantes.";
  }
  return message || "Tente novamente";
}

export default function ConfirmarEmailPage(): ReactNode {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const stateEmail =
    location.state && typeof location.state === "object" && "email" in location.state
      ? String((location.state as { email?: unknown }).email ?? "")
      : "";
  const queryEmail = searchParams.get("email") ?? "";
  const storedEmail = typeof sessionStorage !== "undefined" ? (sessionStorage.getItem("atlas.pendingConfirmEmail") ?? "") : "";

  const [email, setEmail] = useState(normalizeEmail(stateEmail || queryEmail || storedEmail));
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [done, setDone] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  async function handleConfirm(e: FormEvent): Promise<void> {
    e.preventDefault();
    const username = normalizeEmail(email);
    if (!username) {
      addToast({ type: "error", title: "Informe o e-mail do cadastro" });
      return;
    }
    setIsLoading(true);
    try {
      const { confirmSignUp } = await import("@aws-amplify/auth");
      let clientMetadata: Record<string, string> | undefined;
      try {
        const raw = sessionStorage.getItem("atlas.pendingCadastro");
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          clientMetadata = Object.fromEntries(
            Object.entries(parsed)
              .filter(([, value]) => typeof value === "string" && value.length > 0)
              .map(([key, value]) => [key, String(value)]),
          );
        }
      } catch {
        clientMetadata = undefined;
      }
      await confirmSignUp({
        username,
        confirmationCode: code.trim(),
        options: clientMetadata ? { clientMetadata } : undefined,
      });
      const { analytics } = await import("@/lib/analytics");
      analytics.track("email_confirmed");
      sessionStorage.removeItem("atlas.pendingConfirmEmail");
      sessionStorage.removeItem("atlas.pendingCadastro");
      setDone(true);
    } catch (err) {
      addToast({ type: "error", title: "Não foi possível confirmar", description: confirmErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend(): Promise<void> {
    const username = normalizeEmail(email);
    if (!username) {
      addToast({ type: "error", title: "Informe o e-mail do cadastro" });
      return;
    }
    setIsResending(true);
    try {
      const { resendSignUpCode } = await import("@aws-amplify/auth");
      await resendSignUpCode({ username });
      addToast({ type: "success", title: "Novo código enviado", description: "Verifique sua caixa de entrada e o spam." });
    } catch (err) {
      addToast({ type: "error", title: "Não foi possível reenviar", description: confirmErrorMessage(err) });
    } finally {
      setIsResending(false);
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
          <p className="form-hint text-center">O código expira em 24 horas</p>
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
          {isLoading ? <><span className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white" />Confirmando...</> : "Confirmar e-mail"}
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/login" className="inline-flex text-sm font-medium text-muted-foreground hover:text-navy">
          Voltar para o login
        </Link>
      </div>
    </AuthShell>
  );
}
