import { useState, type ReactNode, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { getApiErrorMessage } from "@/services/api";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Building2, TrendingUp, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/logo";

function AuthLayout({ children, title, subtitle }: { readonly children: ReactNode; readonly title: string; readonly subtitle: string }): ReactNode {
  return (
    <div className="flex min-h-screen">
      {/* Left — brand panel */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-[#0d1830] p-12 lg:flex xl:w-[40%]">
        {/* Blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full opacity-25 blur-[100px]" style={{ background: "radial-gradient(circle, #1B2B5E, transparent)" }} />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full opacity-20 blur-[80px]" style={{ background: "radial-gradient(circle, #C49020, transparent)" }} />
        </div>
        {/* Grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="relative">
          <Logo size="md" scheme="dark" />
        </div>

        <div className="relative">
          <h2 className="text-4xl font-black leading-[1.15] text-white xl:text-5xl">
            Construa sem banco.<br />
            <span className="text-gradient-gold">Capte com investidores.</span>
          </h2>
          <p className="mt-5 text-base text-white/50 leading-relaxed">
            A plataforma de crowdfunding imobiliário regulada pela CVM Resolução 88.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { icon: Building2,  label: "Para\nIncorporadoras" },
              { icon: TrendingUp, label: "Rentabilidade\nCompetitiva" },
              { icon: ShieldCheck,label: "CVM\nRegulado" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-white/5 p-4 text-center">
                <Icon className="mx-auto mb-2 h-5 w-5 text-gold" />
                <p className="whitespace-pre-line text-[10px] font-semibold leading-tight text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/20">© 2026 Atlas Hub · CVM Resolução 88</p>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 flex-col justify-center bg-[#F8FAFC] px-5 py-12 sm:px-8 lg:px-12 xl:px-16">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Logo size="md" />
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage(): ReactNode {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [newPwd, setNewPwd]     = useState("");
  const [showNew, setShowNew]   = useState(false);

  const { login, pendingChallenge, handleNewPasswordRequired } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      navigate(user?.perfil === "INCORPORADORA" ? "/dashboard" : "/admin");
    } catch (err) {
      addToast({ type: "error", title: "Credenciais inválidas", description: getApiErrorMessage(err) });
    } finally { setLoading(false); }
  }

  async function handleNewPass(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    try {
      await handleNewPasswordRequired(newPwd);
      const user = useAuthStore.getState().user;
      navigate(user?.perfil === "INCORPORADORA" ? "/dashboard" : "/admin");
    } catch (err) {
      addToast({ type: "error", title: "Erro", description: getApiErrorMessage(err) });
    } finally { setLoading(false); }
  }

  if (pendingChallenge?.type === "NEW_PASSWORD_REQUIRED") {
    return (
      <AuthLayout title="Defina sua senha" subtitle="Primeiro acesso — crie uma senha segura para continuar.">
        <form onSubmit={(e) => void handleNewPass(e)} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Nova senha</label>
            <div className="relative">
              <input type={showNew ? "text" : "password"} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={8} className="field pr-11" placeholder="Mínimo 8 caracteres" />
              <button type="button" onClick={() => setShowNew((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-navy btn-lg w-full rounded-2xl">
            {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><ArrowRight className="h-4 w-4" /> Definir senha e entrar</>}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Bem-vindo de volta" subtitle="Entre com suas credenciais para acessar a plataforma.">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="form-group">
          <label className="form-label">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="field pl-11" placeholder="seu@email.com.br" />
          </div>
        </div>

        <div className="form-group">
          <div className="flex items-center justify-between">
            <label className="form-label">Senha</label>
            <Link to="/esqueci-senha" className="text-xs font-semibold text-navy hover:underline">Esqueci minha senha</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="field px-11" placeholder="Sua senha" />
            <button type="button" onClick={() => setShowPwd((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-navy btn-lg w-full rounded-2xl mt-2">
          {loading
            ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            : <><ArrowRight className="h-4 w-4" />Entrar na plataforma</>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Incorporadora sem conta?{" "}
        <Link to="/cadastro" className="font-bold text-navy hover:underline">Criar conta grátis</Link>
      </p>
    </AuthLayout>
  );
}
