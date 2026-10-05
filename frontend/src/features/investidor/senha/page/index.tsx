import { useState, type ReactNode, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToastStore } from "@/stores/toast";
import { getApiErrorMessage } from "@/services/api";
import { cn } from "@/lib/utils";

export default function InvestidorSenhaPage(): ReactNode {
  const addToast = useToastStore((s) => s.addToast);
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [conf, setConf] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const senhaCurta = nova.length > 0 && nova.length < 8;
  const diferentes = conf.length > 0 && nova !== conf;
  const valido = atual.length > 0 && nova.length >= 8 && nova === conf;

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (nova.length < 8) {
      addToast({ type: "error", title: "A nova senha deve ter no mínimo 8 caracteres" });
      return;
    }
    if (nova !== conf) {
      addToast({ type: "error", title: "As senhas não conferem" });
      return;
    }
    setSaving(true);
    try {
      const { updatePassword } = await import("@aws-amplify/auth");
      await updatePassword({ oldPassword: atual, newPassword: nova });
      addToast({ type: "success", title: "Senha alterada", description: "Use a nova senha no próximo acesso." });
      setAtual("");
      setNova("");
      setConf("");
    } catch (err) {
      addToast({ type: "error", title: "Não foi possível alterar", description: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/investir/perfil" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-navy">
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar ao perfil
      </Link>

      <h1 className="mt-4 text-lg font-extrabold uppercase tracking-wide text-foreground">Alterar senha</h1>
      <p className="mt-1 text-sm text-muted-foreground">Defina uma nova senha de acesso à sua conta.</p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4 rounded-[12px] border border-border bg-card p-6">
        <div className="form-group">
          <label className="form-label">Senha atual</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              className="field pr-10"
              placeholder="Sua senha atual"
              value={atual}
              onChange={(e) => setAtual(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button type="button" onClick={() => setShow((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nova senha</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              className={cn("field pr-10", senhaCurta && "field-error")}
              placeholder="Mínimo 8 caracteres"
              value={nova}
              onChange={(e) => setNova(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          {senhaCurta && <p className="form-error">A senha deve ter no mínimo 8 caracteres</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Confirmar nova senha</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              className={cn("field pr-10", diferentes && "field-error")}
              placeholder="Repita a nova senha"
              value={conf}
              onChange={(e) => setConf(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          {diferentes && <p className="form-error">As senhas não conferem</p>}
        </div>

        <button type="submit" disabled={saving || !valido} className="btn btn-navy mt-2 w-full sm:w-auto">
          {saving ? "Alterando..." : "Alterar senha"}
        </button>
      </form>
    </div>
  );
}
