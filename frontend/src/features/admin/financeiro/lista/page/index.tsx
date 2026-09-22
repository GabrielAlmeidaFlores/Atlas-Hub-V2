import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Landmark, ArrowRight, Wallet } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import type { FinanceiroContasResponse, ProjetoElegivel, SpeConta } from "@/types";
import { TESOURARIA_CONTA_ID } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonPage } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatCnpj, formatDate, isValidCnpj } from "@/lib/utils";
import { cn } from "@/lib/utils";

const COLUMNS = [
  { label: "Projeto" },
  { label: "SPE" },
  { label: "Saldo" },
  { label: "Status" },
  { label: "Cartão" },
  { label: "Aberta em" },
  { label: "", align: "right" as const },
];

function centsToReais(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  return formatCurrency(cents / 100);
}

export default function AdminFinanceiroListaPage(): ReactNode {
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);
  const isMaster = user?.perfil === "ADMIN_MASTER";
  const [data, setData] = useState<FinanceiroContasResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSpe, setShowSpe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ projetoId: "", cnpjSpe: "", razaoSocialSpe: "" });

  async function load(): Promise<void> {
    const r = await api.get<FinanceiroContasResponse>("/admin/financeiro/contas");
    setData(r);
    setError(null);
  }

  useEffect(() => {
    void load()
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err));
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <SkeletonPage />;
  if (data === null) {
    return (
      <div className="animate-in">
        <PageHeader title="Financeiro" description="Contas das obras após o sucesso da oferta" />
        <div className="page-content">
          <EmptyState
            icon={Landmark}
            title="Não foi possível carregar o financeiro"
            description={error ?? "Tente novamente em instantes."}
            action={
              <button type="button" className="btn btn-primary btn-sm rounded-[8px]" onClick={() => { setIsLoading(true); void load().catch((err: unknown) => setError(getApiErrorMessage(err))).finally(() => setIsLoading(false)); }}>
                Tentar de novo
              </button>
            }
          />
        </div>
      </div>
    );
  }

  async function openTreasury(): Promise<void> {
    setIsSaving(true);
    try {
      await api.post("/admin/financeiro/contas", { tipo: "TESOURARIA" });
      addToast({ type: "success", title: "Tesouraria Atlas aberta" });
      await load();
    } catch (err) {
      addToast({ type: "error", title: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function openSpe(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!isValidCnpj(form.cnpjSpe)) {
      addToast({ type: "error", title: "CNPJ da SPE inválido" });
      return;
    }
    setIsSaving(true);
    try {
      await api.post("/admin/financeiro/contas", {
        tipo: "SPE",
        projetoId: form.projetoId,
        cnpjSpe: form.cnpjSpe.replace(/\D/g, ""),
        razaoSocialSpe: form.razaoSocialSpe,
      });
      addToast({ type: "success", title: "Conta SPE aberta" });
      setShowSpe(false);
      setForm({ projetoId: "", cnpjSpe: "", razaoSocialSpe: "" });
      await load();
    } catch (err) {
      addToast({ type: "error", title: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  const tesouraria: SpeConta | null = data.tesouraria;
  const elegiveis: ProjetoElegivel[] = data.elegiveis;
  const cnpjSpeDigits = form.cnpjSpe.replace(/\D/g, "");
  const cnpjSpeCompleto = cnpjSpeDigits.length === 14;
  const cnpjSpeValido = isValidCnpj(form.cnpjSpe);

  return (
    <div className="animate-in">
      <PageHeader
        title="Financeiro"
        description="Saldo e Pix das obras depois que a captação fecha. O dinheiro da oferta não passa por aqui."
        action={
          isMaster ? (
            <div className="flex flex-wrap gap-2">
              {tesouraria === null && (
                <button type="button" className="btn btn-secondary btn-sm rounded-[8px]" disabled={isSaving} onClick={() => void openTreasury()}>
                  Abrir tesouraria
                </button>
              )}
              <button type="button" className="btn btn-primary btn-sm rounded-[8px]" disabled={elegiveis.length === 0} onClick={() => setShowSpe(true)}>
                Abrir conta SPE
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="page-content space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border border-border bg-card px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">1. Oferta publicada</p>
            <p className="mt-1 text-xs text-muted-foreground">Só projetos com oferta no ar entram nesta lista.</p>
          </div>
          <div className="border border-border bg-card px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">2. Abrir conta da obra</p>
            <p className="mt-1 text-xs text-muted-foreground">Cada projeto ganha saldo e extrato isolados.</p>
          </div>
          <div className="border border-border bg-card px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">3. Pix com dois admins</p>
            <p className="mt-1 text-xs text-muted-foreground">Um solicita a saída; outro admin master precisa aprovar.</p>
          </div>
        </div>

        {!data.configured && (
          <p className="alert-warn px-4 py-3 text-xs text-status-warning">
            Banco ainda não conectado neste ambiente. Você vê as telas, mas saldo ao vivo e Pix só funcionam depois das credenciais.
          </p>
        )}

        {!isMaster && (
          <p className="text-xs text-muted-foreground">
            Você pode consultar saldo e extrato. Abrir conta e movimentar Pix é só para admin master.
          </p>
        )}

        {tesouraria !== null && (
          <Link
            to={`/admin/financeiro/${encodeURIComponent(TESOURARIA_CONTA_ID)}`}
            className="card card-hover flex items-center gap-4 p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center bg-navy-50 text-navy">
              <Wallet className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Tesouraria Atlas</p>
              <p className="mt-1 font-semibold text-foreground">{centsToReais(tesouraria.saldoCents)}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{tesouraria.pixKey ?? tesouraria.username}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        )}

        {data.items.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="Nenhuma conta de obra"
            description="Quando uma oferta for publicada, o admin master abre a conta da SPE aqui. A captação continua na plataforma regulada."
          />
        ) : (
          <DataTable columns={COLUMNS} total={data.items.length} emptyMessage="Nenhuma conta SPE.">
            {data.items.map((conta) => (
              <tr key={conta.projetoId} className="table-row">
                <td>
                  <p className="font-semibold text-foreground">{conta.projetoNome ?? conta.projetoId}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{conta.username}</p>
                </td>
                <td>
                  <p className="text-foreground">{conta.razaoSocialSpe ?? "—"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {conta.cnpjSpe !== undefined ? formatCnpj(conta.cnpjSpe) : "—"}
                  </p>
                </td>
                <td className="font-medium text-foreground">{centsToReais(conta.saldoCents)}</td>
                <td>
                  <span className={cn(
                    "badge border",
                    conta.status === "ATIVA" && "badge-aprovado",
                    conta.status === "BLOQUEADA" && "badge-ajuste",
                    conta.status === "ERRO" && "badge-reprovado",
                  )}
                  >
                    {conta.status === "ATIVA" ? "Ativa" : conta.status === "BLOQUEADA" ? "Bloqueada" : "Erro"}
                  </span>
                </td>
                <td>
                  <span className={cn("badge border", conta.statusCartao === "SOLICITADO" ? "badge-aprovado" : "badge-ajuste")}>
                    {conta.statusCartao === "SOLICITADO" ? "Solicitado" : "Preparação"}
                  </span>
                </td>
                <td className="text-muted-foreground">{formatDate(conta.criadoEm)}</td>
                <td className="text-right">
                  <Link to={`/admin/financeiro/${encodeURIComponent(conta.projetoId)}`} className="btn btn-ghost btn-sm inline-flex">
                    Ver <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>

      <Modal
        open={showSpe}
        onOpenChange={setShowSpe}
        title="Abrir conta da obra"
        description="Cria a conta bancária isolada deste projeto. Informe o CNPJ da SPE só para identificação — a conta opera no CNPJ Atlas."
        className="max-w-xl"
      >
        <form onSubmit={(e) => void openSpe(e)} className="space-y-5">
          <div className="form-group">
            <label className="form-label">Projeto</label>
            <select
              className="input-base"
              value={form.projetoId}
              onChange={(e) => setForm((p) => ({ ...p, projetoId: e.target.value }))}
              required
            >
              <option value="">Selecione</option>
              {elegiveis.map((p) => (
                <option key={p.id} value={p.id}>{p.nome} — {p.cidade}/{p.estado}</option>
              ))}
            </select>
            {elegiveis.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">Não há oferta publicada sem conta. Confirme a publicação no histórico de curadoria.</p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Razão social da SPE</label>
            <input
              className="input-base"
              value={form.razaoSocialSpe}
              onChange={(e) => setForm((p) => ({ ...p, razaoSocialSpe: e.target.value }))}
              required
              minLength={3}
            />
          </div>
          <div className="form-group">
            <label className="form-label">CNPJ da SPE</label>
            <input
              className={cn("input-base", cnpjSpeCompleto && !cnpjSpeValido && "field-error")}
              value={formatCnpj(form.cnpjSpe)}
              onChange={(e) => setForm((p) => ({ ...p, cnpjSpe: e.target.value.replace(/\D/g, "").slice(0, 14) }))}
              required
              inputMode="numeric"
              placeholder="00.000.000/0001-00"
              maxLength={18}
            />
            {cnpjSpeCompleto && !cnpjSpeValido && (
              <p className="form-error">CNPJ inválido</p>
            )}
            {cnpjSpeValido && (
              <p className="mt-1 text-xs font-medium text-status-success">CNPJ válido</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-secondary rounded-[8px]" onClick={() => setShowSpe(false)}>Cancelar</button>
            <button type="submit" disabled={isSaving || form.projetoId.length === 0 || !cnpjSpeValido} className="btn btn-primary rounded-[8px]">
              {isSaving ? "Abrindo…" : "Abrir conta"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
