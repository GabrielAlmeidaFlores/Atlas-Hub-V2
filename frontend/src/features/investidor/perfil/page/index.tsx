import { useState, type ReactNode, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CircleUserRound, Mail, KeyRound } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { getApiErrorMessage } from "@/services/api";

export default function InvestidorPerfilPage(): ReactNode {
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);
  const [nome, setNome] = useState(user?.nome ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (nome.trim().length < 3) {
      addToast({ type: "error", title: "Informe seu nome completo" });
      return;
    }
    setSaving(true);
    try {
      const { updateUserAttributes } = await import("@aws-amplify/auth");
      await updateUserAttributes({ userAttributes: { name: nome.trim() } });
      addToast({ type: "success", title: "Perfil atualizado" });
    } catch (err) {
      addToast({ type: "error", title: "Não foi possível salvar", description: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  const display = nome.trim().length > 0 ? nome.trim() : user?.email ?? "Investidor";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-lg font-extrabold uppercase tracking-wide text-foreground">Perfil</h1>
      <p className="mt-1 text-sm text-muted-foreground">Seus dados de acesso na Atlas Hub.</p>

      <div className="mt-6 rounded-[12px] border border-border bg-card">
        <div className="flex items-center gap-4 border-b border-border p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] bg-navy text-xl font-extrabold text-white">
            {display.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-foreground">{display}</p>
            <p className="text-xs text-muted-foreground">Investidor · Conta Atlas Hub</p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSave(e)} className="space-y-4 p-6">
          <div className="form-group">
            <label className="form-label">Nome completo</label>
            <div className="relative">
              <CircleUserRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="field pl-10"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="name"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className="field pl-10" value={user?.email ?? ""} disabled />
            </div>
            <p className="form-hint">O e-mail de acesso não pode ser alterado por aqui.</p>
          </div>
          <button type="submit" disabled={saving} className="btn btn-navy">
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>

        <div className="flex items-center justify-between gap-4 border-t border-border p-6">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-navy" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-semibold text-foreground">Senha</p>
              <p className="text-xs text-muted-foreground">Altere sua senha de acesso.</p>
            </div>
          </div>
          <Link to="/investir/senha" className="btn btn-outline btn-sm shrink-0">
            Alterar senha
          </Link>
        </div>
      </div>
    </div>
  );
}
