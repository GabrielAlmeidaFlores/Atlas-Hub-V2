import { useState, type ReactNode, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToastStore } from "@/stores/toast";
import { Building2, User, Mail, Phone, Lock, Eye, EyeOff, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

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
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  function f(field: keyof FormData) {
    return (e: ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (form.senha !== form.confirmarSenha) {
      addToast({ type: "error", title: "Senhas não conferem" });
      return;
    }
    setIsLoading(true);
    try {
      const { signUp } = await import("@aws-amplify/auth");
      await signUp({ username: form.email, password: form.senha, options: { userAttributes: { email: form.email } } });
      addToast({ type: "success", title: "Conta criada!", description: "Verifique seu e-mail para confirmar." });
      navigate("/confirmar-email");
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
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--navy) 1px, transparent 1px), linear-gradient(90deg, var(--navy) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative w-full max-w-lg animate-in">
        <div className="mb-6 text-center">
          <div className="mb-6 flex justify-center"><Logo size="lg" /></div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">Cadastro de Incorporadora</h1>
          <p className="mt-1 text-xs text-muted-foreground">Crie sua conta para submeter projetos à curadoria</p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-0">
          {STEPS.map(({ num, label }, idx) => (
            <div key={num} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  "step",
                  step > num ? "step-done" : step === num ? "step-active" : "step-pending",
                )}>
                  {step > num ? <Check className="h-3.5 w-3.5" /> : String(num)}
                </div>
                <span className={cn(
                  "hidden text-[10px] font-bold uppercase tracking-wider sm:block",
                  step === num ? "text-navy" : "text-muted-foreground",
                )}>
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn("mb-5 mx-1 h-px w-10 sm:w-16", step > num ? "bg-status-success" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        <div className="card border border-border p-6 sm:p-8">
          <form onSubmit={(e) => void handleSubmit(e)}>
            {step === 1 && (
              <div className="space-y-4 animate-in">
                <div className="mb-5">
                  <div className="flex h-9 w-9 items-center justify-center bg-navy-50"><Building2 className="h-5 w-5 text-navy" /></div>
                  <h2 className="mt-3 text-sm font-bold uppercase tracking-widest text-foreground">Dados da Empresa</h2>
                  <p className="text-xs text-muted-foreground">Informações sobre a sua incorporadora</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Razão Social</label>
                  <input className="field" placeholder="Ex: Construtora XYZ Ltda" value={form.razaoSocial} onChange={f("razaoSocial")} required />
                </div>
                <div className="form-group">
                  <label className="form-label">CNPJ</label>
                  <input className="field" placeholder="00.000.000/0001-00" value={form.cnpj} onChange={f("cnpj")} required />
                </div>
                <button type="button" onClick={() => setStep(2)} disabled={!form.razaoSocial || !form.cnpj} className="btn btn-navy mt-2 w-full">
                  Continuar <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in">
                <div className="mb-5">
                  <div className="flex h-9 w-9 items-center justify-center bg-navy-50"><User className="h-5 w-5 text-navy" /></div>
                  <h2 className="mt-3 text-sm font-bold uppercase tracking-widest text-foreground">Responsável Legal</h2>
                  <p className="text-xs text-muted-foreground">Dados do representante da empresa</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <input className="field" placeholder="Nome do responsável" value={form.nomeResponsavel} onChange={f("nomeResponsavel")} required />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">CPF</label>
                    <input className="field" placeholder="000.000.000-00" value={form.cpfResponsavel} onChange={f("cpfResponsavel")} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cargo</label>
                    <input className="field" placeholder="Ex: Diretor" value={form.cargoResponsavel} onChange={f("cargoResponsavel")} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input className="field pl-10" placeholder="(11) 99999-9999" value={form.telefone} onChange={f("telefone")} required />
                  </div>
                </div>
                <div className="mt-2 flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn btn-outline flex-1"><ChevronLeft className="h-4 w-4" /> Voltar</button>
                  <button type="button" onClick={() => setStep(3)} disabled={!form.nomeResponsavel || !form.cpfResponsavel} className="btn btn-navy flex-1">
                    Continuar <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in">
                <div className="mb-5">
                  <div className="flex h-9 w-9 items-center justify-center bg-navy-50"><Lock className="h-5 w-5 text-navy" /></div>
                  <h2 className="mt-3 text-sm font-bold uppercase tracking-widest text-foreground">Dados de Acesso</h2>
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
                    <input type={showPwd ? "text" : "password"} className="field pr-10" placeholder="Mínimo 8 caracteres" value={form.senha} onChange={f("senha")} required minLength={8} />
                    <button type="button" onClick={() => setShowPwd((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirmar Senha</label>
                  <input type="password" className="field" placeholder="Repita a senha" value={form.confirmarSenha} onChange={f("confirmarSenha")} required />
                </div>
                <div className="mt-2 flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="btn btn-outline shrink-0"><ChevronLeft className="h-4 w-4" /> Voltar</button>
                  <button type="submit" disabled={isLoading} className="btn btn-navy flex-1">
                    {isLoading ? <><span className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white" />Criando...</> : "Criar conta"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="font-bold uppercase tracking-wider text-navy hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
