import { useState, type ReactNode, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToastStore } from "@/stores/toast";
import { Mail, Phone, Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/features/auth/auth-shell";
import { cn, formatCnpj, formatCpf, formatCelular } from "@/lib/utils";

interface FormData {
  razaoSocial: string;
  cnpj: string;
  nomeResponsavel: string;
  cpfResponsavel: string;
  cargoResponsavel: string;
  email: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
}

const INITIAL: FormData = {
  razaoSocial: "", cnpj: "", nomeResponsavel: "", cpfResponsavel: "",
  cargoResponsavel: "", email: "", telefone: "", senha: "", confirmarSenha: "",
};

export default function CadastroPage(): ReactNode {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  function f(field: keyof FormData) {
    return (e: ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  function onCnpjChange(e: ChangeEvent<HTMLInputElement>): void {
    setForm((p) => ({ ...p, cnpj: formatCnpj(e.target.value) }));
  }

  function onCpfChange(e: ChangeEvent<HTMLInputElement>): void {
    setForm((p) => ({ ...p, cpfResponsavel: formatCpf(e.target.value) }));
  }

  function onCelularChange(e: ChangeEvent<HTMLInputElement>): void {
    setForm((p) => ({ ...p, telefone: formatCelular(e.target.value) }));
  }

  const cnpjDigits = form.cnpj.replace(/\D/g, "");
  const cpfDigits = form.cpfResponsavel.replace(/\D/g, "");
  const celularDigits = form.telefone.replace(/\D/g, "");
  const senhaCurta = form.senha.length > 0 && form.senha.length < 8;
  const senhasDiferentes = form.confirmarSenha.length > 0 && form.senha !== form.confirmarSenha;
  const senhaValida = form.senha.length >= 8 && form.senha === form.confirmarSenha;

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (form.senha.length < 8) {
      addToast({ type: "error", title: "Senha deve ter no mínimo 8 caracteres" });
      return;
    }
    if (form.senha !== form.confirmarSenha) {
      addToast({ type: "error", title: "Senhas não conferem" });
      return;
    }
    setIsLoading(true);
    try {
      const { signUp } = await import("@aws-amplify/auth");
      const email = form.email.trim().toLowerCase();
      await signUp({ username: email, password: form.senha, options: { userAttributes: { email } } });
      sessionStorage.setItem("atlas.pendingConfirmEmail", email);
      sessionStorage.setItem(
        "atlas.pendingCadastro",
        JSON.stringify({
          cnpj: form.cnpj.replace(/\D/g, ""),
          razaoSocial: form.razaoSocial.trim(),
          nomeResponsavel: form.nomeResponsavel.trim(),
          cpfResponsavel: form.cpfResponsavel.replace(/\D/g, ""),
          cargoResponsavel: form.cargoResponsavel.trim(),
          telefone: form.telefone.replace(/\D/g, ""),
        }),
      );
      addToast({ type: "success", title: "Conta criada!", description: "Verifique seu e-mail para confirmar." });
      navigate(`/confirmar-email?email=${encodeURIComponent(email)}`, { state: { email } });
    } catch (err) {
      addToast({ type: "error", title: "Erro no cadastro", description: err instanceof Error ? err.message : "Tente novamente" });
    } finally {
      setIsLoading(false);
    }
  }

  const STEPS = [
    { num: 1 as const, label: "Empresa" },
    { num: 2 as const, label: "Responsável" },
    { num: 3 as const, label: "Acesso" },
  ];

  return (
    <AuthShell
      title="Cadastro de Incorporadora"
      subtitle="Crie sua conta para submeter projetos à curadoria"
    >
      <div className="mb-6 flex items-center justify-center gap-0">
        {STEPS.map(({ num, label }, idx) => (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "text-base font-semibold tabular-nums",
                  step > num ? "text-gold" : step === num ? "text-navy" : "text-muted-foreground",
                )}
              >
                {String(num)}
              </span>
              <span
                className={cn(
                  "hidden text-[10px] font-medium sm:block",
                  step === num ? "text-navy" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn("mb-5 mx-1 h-px w-8 sm:w-12", step > num ? "bg-gold" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={(e) => void handleSubmit(e)}>
        {step === 1 && (
          <div className="space-y-4">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-foreground">Dados da Empresa</h2>
              <p className="text-xs text-muted-foreground">Informações sobre a sua incorporadora</p>
            </div>
            <div className="form-group">
              <label className="form-label">Razão Social</label>
              <input className="field" placeholder="Ex: Construtora XYZ Ltda" value={form.razaoSocial} onChange={f("razaoSocial")} required />
            </div>
            <div className="form-group">
              <label className="form-label">CNPJ</label>
              <input
                className="field"
                placeholder="00.000.000/0001-00"
                value={form.cnpj}
                onChange={onCnpjChange}
                inputMode="numeric"
                maxLength={18}
                required
              />
            </div>
            <button type="button" onClick={() => setStep(2)} disabled={!form.razaoSocial || cnpjDigits.length !== 14} className="btn btn-navy mt-2 w-full">
              Continuar
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-foreground">Responsável Legal</h2>
              <p className="text-xs text-muted-foreground">Dados do representante da empresa</p>
            </div>
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <input className="field" placeholder="Nome do responsável" value={form.nomeResponsavel} onChange={f("nomeResponsavel")} required />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="form-group">
                <label className="form-label">CPF</label>
                <input
                  className="field"
                  placeholder="000.000.000-00"
                  value={form.cpfResponsavel}
                  onChange={onCpfChange}
                  inputMode="numeric"
                  maxLength={14}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cargo</label>
                <input className="field" placeholder="Ex: Diretor" value={form.cargoResponsavel} onChange={f("cargoResponsavel")} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Celular</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="field pl-10"
                  placeholder="(11) 99999-9999"
                  value={form.telefone}
                  onChange={onCelularChange}
                  inputMode="numeric"
                  maxLength={15}
                  required
                />
              </div>
            </div>
            <div className="mt-2 flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn btn-outline flex-1">
                Voltar
              </button>
              <button type="button" onClick={() => setStep(3)} disabled={!form.nomeResponsavel || cpfDigits.length !== 11 || celularDigits.length !== 11} className="btn btn-navy flex-1">
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-foreground">Dados de Acesso</h2>
              <p className="text-xs text-muted-foreground">E-mail e senha para acessar a plataforma</p>
            </div>
            <div className="form-group">
              <label className="form-label">E-mail corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="email" className="field pl-10" placeholder="contato@empresa.com.br" value={form.email} onChange={f("email")} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  className={cn("field pr-10", senhaCurta && "field-error")}
                  placeholder="Mínimo 8 caracteres"
                  value={form.senha}
                  onChange={f("senha")}
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowPwd((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {senhaCurta && <p className="form-error">A senha deve ter no mínimo 8 caracteres</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar Senha</label>
              <div className="relative">
                <input
                  type={showConfirmPwd ? "text" : "password"}
                  className={cn("field pr-10", senhasDiferentes && "field-error")}
                  placeholder="Repita a senha"
                  value={form.confirmarSenha}
                  onChange={f("confirmarSenha")}
                  required
                />
                <button type="button" onClick={() => setShowConfirmPwd((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {senhasDiferentes && <p className="form-error">As senhas não conferem</p>}
            </div>
            <div className="mt-2 flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="btn btn-outline flex-1">
                Voltar
              </button>
              <button type="submit" disabled={isLoading || !senhaValida} className="btn btn-navy flex-1">
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white" />
                    Criando...
                  </>
                ) : (
                  "Criar conta"
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Já tem conta?{" "}
        <Link to="/login" className="font-semibold text-navy hover:underline">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
