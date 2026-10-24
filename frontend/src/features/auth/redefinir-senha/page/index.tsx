import { useState, type ReactNode, type FormEvent } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useToastStore } from "@/stores/toast";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/features/auth/auth-shell";
import { cn, formatCnpj, formatCpf, formatCelular, isValidCnpj, isValidCpf } from "@/lib/utils";
import { getApiErrorMessage } from "@/services/api";

type TipoConta = "investidor" | "incorporadora";

interface ResetState {
  email?: string;
  resetToken?: string;
  needsProfile?: boolean;
  tipo?: TipoConta | null;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export default function RedefinirSenhaPage(): ReactNode {
  const location = useLocation();
  const state = location.state && typeof location.state === "object" ? (location.state as ResetState) : {};
  const storedEmail = typeof sessionStorage !== "undefined" ? (sessionStorage.getItem("atlas.resetEmail") ?? "") : "";
  const storedToken = typeof sessionStorage !== "undefined" ? (sessionStorage.getItem("atlas.resetToken") ?? "") : "";
  const storedNeedsProfile = typeof sessionStorage !== "undefined" ? (sessionStorage.getItem("atlas.resetNeedsProfile") ?? "") : "";
  const storedTipo = typeof sessionStorage !== "undefined" ? (sessionStorage.getItem("atlas.resetTipo") ?? "") : "";

  const email = normalizeEmail(state.email ?? storedEmail);
  const resetToken = state.resetToken ?? storedToken;
  const needsProfile = state.needsProfile ?? storedNeedsProfile === "1";
  const tipoInicial: TipoConta | null =
    state.tipo ?? (storedTipo === "investidor" || storedTipo === "incorporadora" ? storedTipo : null);

  const [tipo, setTipo] = useState<TipoConta | "">(tipoInicial ?? "");
  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [cpfResponsavel, setCpfResponsavel] = useState("");
  const [cargoResponsavel, setCargoResponsavel] = useState("");
  const [telefone, setTelefone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  const cnpjDigits = cnpj.replace(/\D/g, "");
  const cpfDigits = cpfResponsavel.replace(/\D/g, "");
  const telefoneDigits = telefone.replace(/\D/g, "");
  const senhaCurta = newPassword.length > 0 && newPassword.length < 8;
  const senhasDiferentes = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const senhaValida = newPassword.length >= 8 && newPassword === confirmPassword && Boolean(/\d/.test(newPassword));
  const empresaValida =
    razaoSocial.trim().length >= 2
    && nomeResponsavel.trim().length >= 2
    && cargoResponsavel.trim().length >= 2
    && cnpjDigits.length === 14
    && isValidCnpj(cnpj)
    && cpfDigits.length === 11
    && isValidCpf(cpfResponsavel)
    && telefoneDigits.length >= 10;
  const mostraEmpresa = needsProfile && tipo === "incorporadora";
  const formValido = senhaValida && (!needsProfile || tipo !== "") && (!mostraEmpresa || empresaValida);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!email || resetToken === "") {
      addToast({ type: "error", title: "Sessão expirada", description: "Solicite o código novamente." });
      navigate("/esqueci-senha");
      return;
    }
    if (!senhaValida) {
      addToast({ type: "error", title: "Senha inválida", description: "Use no mínimo 8 caracteres, com ao menos 1 número." });
      return;
    }
    if (needsProfile && tipo === "") {
      addToast({ type: "error", title: "Selecione o tipo de conta", description: "Informe se a conta é de investidor ou incorporadora." });
      return;
    }
    if (mostraEmpresa && !empresaValida) {
      addToast({ type: "error", title: "Complete os dados da empresa", description: "Confira CNPJ, razão social, responsável, CPF, cargo e telefone." });
      return;
    }

    setIsLoading(true);
    try {
      const { api } = await import("@/services/api");
      const res = await api.post<{ ok: boolean; tipo: TipoConta }>("/publico/auth/reset-confirmar", {
        email,
        resetToken,
        newPassword,
        ...(needsProfile ? { tipo } : {}),
        ...(mostraEmpresa ? { cnpj, razaoSocial, nomeResponsavel, cpfResponsavel, cargoResponsavel, telefone } : {}),
      });
      sessionStorage.removeItem("atlas.resetEmail");
      sessionStorage.removeItem("atlas.resetToken");
      sessionStorage.removeItem("atlas.resetNeedsProfile");
      sessionStorage.removeItem("atlas.resetTipo");
      sessionStorage.removeItem("atlas.resetCode");
      addToast({ type: "success", title: "Senha redefinida!", description: "Sua conta está ativa. Faça login com a nova senha." });
      navigate(res.tipo === "investidor" ? "/investir/login" : "/login");
    } catch (err) {
      addToast({ type: "error", title: "Não foi possível redefinir", description: getApiErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  }

  if (!email || resetToken === "") {
    return (
      <AuthShell title="Nova senha" subtitle="Solicite um código para continuar.">
        <p className="text-center text-sm text-muted-foreground">Não encontramos uma sessão válida para redefinir a senha.</p>
        <Link to="/esqueci-senha" className="btn btn-navy mt-6 w-full">
          Recuperar senha
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Nova senha"
      subtitle={needsProfile ? "Defina sua senha e complete o cadastro." : "Escolha uma nova senha para acessar a plataforma."}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="form-group">
          <label className="form-label">Nova senha</label>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              className={cn("field pr-10", senhaCurta && "field-error")}
              placeholder="Mínimo 8 caracteres, com número"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPwd((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {senhaCurta && <p className="form-error">A senha deve ter no mínimo 8 caracteres</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Confirmar senha</label>
          <div className="relative">
            <input
              type={showConfirmPwd ? "text" : "password"}
              className={cn("field pr-10", senhasDiferentes && "field-error")}
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowConfirmPwd((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {senhasDiferentes && <p className="form-error">As senhas não conferem</p>}
        </div>

        {needsProfile && (
          <div className="space-y-4 border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground">Complete seu cadastro</p>
            <div className="form-group">
              <label className="form-label">Tipo de conta</label>
              <select className="field" value={tipo} onChange={(e) => setTipo(e.target.value as TipoConta | "")}>
                <option value="">Selecione...</option>
                <option value="investidor">Investidor</option>
                <option value="incorporadora">Incorporadora</option>
              </select>
            </div>

            {mostraEmpresa && (
              <>
                <div className="form-group">
                  <label className="form-label">CNPJ</label>
                  <input
                    className={cn("field", cnpjDigits.length === 14 && !isValidCnpj(cnpj) && "field-error")}
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                    inputMode="numeric"
                  />
                  {cnpjDigits.length === 14 && !isValidCnpj(cnpj) && <p className="form-error">CNPJ inválido</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Razão social</label>
                  <input className="field" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nome do responsável</label>
                  <input className="field" value={nomeResponsavel} onChange={(e) => setNomeResponsavel(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">CPF do responsável</label>
                  <input
                    className={cn("field", cpfDigits.length === 11 && !isValidCpf(cpfResponsavel) && "field-error")}
                    placeholder="000.000.000-00"
                    value={cpfResponsavel}
                    onChange={(e) => setCpfResponsavel(formatCpf(e.target.value))}
                    inputMode="numeric"
                  />
                  {cpfDigits.length === 11 && !isValidCpf(cpfResponsavel) && <p className="form-error">CPF inválido</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo do responsável</label>
                  <input className="field" value={cargoResponsavel} onChange={(e) => setCargoResponsavel(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input
                    className="field"
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(formatCelular(e.target.value))}
                    inputMode="numeric"
                  />
                </div>
              </>
            )}
          </div>
        )}

        <button type="submit" disabled={isLoading || !formValido} className="btn btn-navy w-full">
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white" />
              Salvando...
            </>
          ) : (
            "Redefinir senha"
          )}
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link to={`/verificar-codigo-senha?email=${encodeURIComponent(email)}`} className="inline-flex text-sm font-medium text-muted-foreground hover:text-navy">
          Voltar
        </Link>
      </div>
    </AuthShell>
  );
}
