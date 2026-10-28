import { useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { USE_LOCAL_MOCKS } from "@/lib/env";
import { getApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { cn } from "@/lib/utils";

export default function SecuritySection(): ReactNode {
  const addToast = useToastStore((state) => state.addToast);
  const user = useAuthStore((state) => state.user);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const tooShort = newPassword.length > 0 && newPassword.length < 8;
  const noNumber = newPassword.length > 0 && !/\d/.test(newPassword);
  const mismatched = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const sameAsCurrent = newPassword.length > 0 && newPassword === currentPassword;
  const valid = currentPassword.length > 0
    && newPassword.length >= 8
    && /\d/.test(newPassword)
    && newPassword === confirmPassword
    && newPassword !== currentPassword;

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      if (USE_LOCAL_MOCKS) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      } else {
        const { updatePassword } = await import("@aws-amplify/auth");
        await updatePassword({ oldPassword: currentPassword, newPassword });
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      addToast({ type: "success", title: "Senha alterada", description: "Use a nova senha no próximo acesso." });
    } catch (err) {
      addToast({ type: "error", title: "Não foi possível alterar a senha", description: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Segurança e acesso</h2>
        <p className="mt-1 text-xs text-muted-foreground">Altere a senha da sua conta administrativa.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <form onSubmit={(event) => void handleSubmit(event)} className="card space-y-5 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-navy/[0.06] text-navy">
              <LockKeyhole className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Alterar senha</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="current-password">Senha atual</label>
            <div className="relative">
              <input
                id="current-password"
                type={showPassword ? "text" : "password"}
                className="field pr-11"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Ocultar senhas" : "Mostrar senhas"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">Nova senha</label>
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                className={cn("field", (tooShort || noNumber || sameAsCurrent) && "field-error")}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
              {tooShort && <p className="form-error">A senha deve ter no mínimo 8 caracteres</p>}
              {noNumber && <p className="form-error">A senha deve conter ao menos 1 número</p>}
              {sameAsCurrent && <p className="form-error">A nova senha deve ser diferente da atual</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">Confirmar nova senha</label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                className={cn("field", mismatched && "field-error")}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
              {mismatched && <p className="form-error">As senhas não conferem</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-[10px] leading-relaxed text-muted-foreground">A senha é gerenciada pelo Cognito e passa a valer imediatamente.</p>
            <button type="submit" className="btn btn-primary rounded-[8px]" disabled={saving || !valid}>
              {saving ? "Alterando..." : "Alterar senha"}
            </button>
          </div>
        </form>

        <aside className="space-y-3">
          <div className="rounded-[10px] border border-border bg-card p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-foreground"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> Política de senha</h3>
            <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-muted-foreground">
              <li>Mínimo de 8 caracteres</li>
              <li>Pelo menos 1 número</li>
              <li>Diferente da senha atual</li>
            </ul>
          </div>
          <div className="rounded-[10px] border border-status-info-border bg-status-info-subtle p-4">
            <p className="text-[11px] leading-relaxed text-status-info">Se você esqueceu a senha atual, encerre a sessão e use “Esqueci minha senha” na tela de login.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
