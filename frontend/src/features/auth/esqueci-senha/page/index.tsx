import { useState, type ReactNode, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, SendHorizonal } from "lucide-react";
import { useToastStore } from "@/stores/toast";

export default function EsqueciSenhaPage(): ReactNode {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { resetPassword } = await import("@aws-amplify/auth");
      await resetPassword({ username: email });
    } catch {
      /* security: always show success */
    } finally {
      setIsLoading(false);
      setSent(true);
      addToast({ type: "success", title: "E-mail enviado!", description: "Verifique sua caixa de entrada." });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6FA] p-4 sm:p-8">
      <div className="w-full max-w-sm animate-in">
        <div className="mb-6 flex justify-center">
          <img src="/atlas-logo.png" alt="Atlas Hub" className="h-7 object-contain" />
        </div>
        <div className="card p-6 sm:p-8">
          <div className="mb-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50">
              <Mail className="h-5 w-5 text-navy" />
            </div>
            <h1 className="text-xl font-bold text-[#111827]">Recuperar senha</h1>
            <p className="mt-1 text-sm text-[#6B7280]">Informe seu e-mail e enviaremos as instruções</p>
          </div>

          {sent ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-sm font-medium text-green-800">Instruções enviadas</p>
              <p className="mt-1 text-xs text-green-700">Se o e-mail estiver cadastrado, você receberá o link em breve.</p>
              <Link to="/login" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-navy hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div className="form-group">
                <label className="form-label">E-mail cadastrado</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input type="email" className="input-base pl-10" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                {isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Enviando...</> : <><SendHorizonal className="h-4 w-4" />Enviar instruções</>}
              </button>
            </form>
          )}
        </div>

        {!sent && (
          <div className="mt-4 text-center">
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-navy">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
