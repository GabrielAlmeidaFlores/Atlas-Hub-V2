import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import type {
  FinanceiroAuditoriaEntry,
  FinanceiroLedgerEntry,
  FinanceiroSolicitacao,
  SolicitacaoStatus,
  SpeConta,
} from "@/types";
import { TESOURARIA_CONTA_ID } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonPage } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const EXTRATO_COLS = [
  { label: "Data" },
  { label: "Descrição" },
  { label: "Tipo" },
  { label: "Valor", align: "right" as const },
];

const SOL_COLS = [
  { label: "Valor" },
  { label: "Destino" },
  { label: "Solicitante" },
  { label: "Status" },
  { label: "", align: "right" as const },
];

const AUDIT_COLS = [
  { label: "Data" },
  { label: "Ação" },
  { label: "Quem" },
  { label: "Descrição" },
];

const AUDIT_LABEL: Record<string, string> = {
  CONTA_CRIADA: "Conta aberta",
  SOLICITACAO_CRIADA: "Pix solicitado",
  SOLICITACAO_APROVADA: "Pix aprovado",
  SOLICITACAO_REJEITADA: "Pix rejeitado",
  TRANSFERENCIA_EXECUTADA: "Pix enviado",
  TRANSFERENCIA_FALHOU: "Pix falhou",
  WEBHOOK_CONCILIADO: "Movimento conciliado",
};

const STATUS_LABEL: Record<SolicitacaoStatus, string> = {
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  EXECUTADA: "Executada",
  REJEITADA: "Rejeitada",
  FALHOU: "Falhou",
};

const TIPO_LABEL: Record<string, string> = {
  DEPOSIT: "Entrada",
  TRANSFER: "Saída",
  INVOICE: "Cobrança",
  TRANSACTION: "Movimento",
};

function centsToReais(cents: number): string {
  return formatCurrency(cents / 100);
}

function statusClass(status: SolicitacaoStatus): string {
  if (status === "EXECUTADA" || status === "APROVADA") return "badge-aprovado";
  if (status === "PENDENTE") return "badge-ajuste";
  return "badge-reprovado";
}

export default function AdminFinanceiroDetalhePage(): ReactNode {
  const { projetoId = "" } = useParams();
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);
  const isMaster = user?.perfil === "ADMIN_MASTER";
  const [conta, setConta] = useState<SpeConta | null>(null);
  const [saldoCents, setSaldoCents] = useState<number | null>(null);
  const [configured, setConfigured] = useState(true);
  const [extrato, setExtrato] = useState<FinanceiroLedgerEntry[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<FinanceiroSolicitacao[]>([]);
  const [auditoria, setAuditoria] = useState<FinanceiroAuditoriaEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ amountReais: "", description: "", pixKey: "" });

  async function load(): Promise<void> {
    const encoded = encodeURIComponent(projetoId);
    const [detalhe, statement, movimentos] = await Promise.all([
      api.get<{ conta: SpeConta; saldoCents: number | null; configured: boolean }>(`/admin/financeiro/contas/${encoded}`),
      api.get<{ items: FinanceiroLedgerEntry[] }>(`/admin/financeiro/contas/${encoded}/extrato`),
      api.get<{ solicitacoes: FinanceiroSolicitacao[]; auditoria: FinanceiroAuditoriaEntry[] }>(
        `/admin/financeiro/contas/${encoded}/movimentos`,
      ),
    ]);
    setConta(detalhe.conta);
    setSaldoCents(detalhe.saldoCents);
    setConfigured(detalhe.configured);
    setExtrato(statement.items);
    setSolicitacoes(movimentos.solicitacoes);
    setAuditoria(movimentos.auditoria);
    setError(null);
  }

  useEffect(() => {
    setIsLoading(true);
    void load()
      .catch((err: unknown) => {
        setConta(null);
        setError(getApiErrorMessage(err));
      })
      .finally(() => setIsLoading(false));
  }, [projetoId]);

  if (isLoading) return <SkeletonPage />;
  if (conta === null) {
    return (
      <div className="page-content py-10">
        <p className="text-sm text-muted-foreground">{error ?? "Conta não encontrada."}</p>
        <Link to="/admin/financeiro" className="btn btn-outline btn-sm mt-4 inline-flex">Voltar</Link>
      </div>
    );
  }

  const titulo = conta.tipo === "TESOURARIA" ? "Tesouraria Atlas" : (conta.projetoNome ?? "Conta SPE");

  async function criarSolicitacao(e: FormEvent): Promise<void> {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post("/admin/financeiro/solicitacoes", {
        projetoId,
        amountReais: Number(form.amountReais.replace(",", ".")),
        description: form.description,
        pixKey: form.pixKey,
      });
      addToast({ type: "success", title: "Solicitação criada", description: "Aguarde o segundo admin master." });
      setShowPix(false);
      setForm({ amountReais: "", description: "", pixKey: "" });
      await load();
    } catch (err) {
      addToast({ type: "error", title: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function aprovar(id: string): Promise<void> {
    setIsSaving(true);
    try {
      await api.post(`/admin/financeiro/solicitacoes/${encodeURIComponent(id)}/aprovar`, {});
      addToast({ type: "success", title: "Pix executado" });
      await load();
    } catch (err) {
      addToast({ type: "error", title: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function rejeitar(id: string): Promise<void> {
    setIsSaving(true);
    try {
      await api.post(`/admin/financeiro/solicitacoes/${encodeURIComponent(id)}/rejeitar`, {});
      addToast({ type: "success", title: "Solicitação rejeitada" });
      await load();
    } catch (err) {
      addToast({ type: "error", title: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="animate-in">
      <PageHeader
        title={titulo}
        description={conta.razaoSocialSpe ?? conta.username}
        breadcrumb={
          <Link to="/admin/financeiro" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-navy">
            <ArrowLeft className="h-3 w-3" /> Financeiro
          </Link>
        }
        action={
          isMaster ? (
            <button type="button" className="btn btn-primary btn-sm rounded-[8px]" onClick={() => setShowPix(true)}>
              Solicitar Pix
            </button>
          ) : undefined
        }
      />

      <div className="page-content space-y-6">
        {!configured && (
          <p className="alert-warn px-4 py-3 text-xs text-status-warning">
            Integração bancária não configurada. Você consulta a conta, mas saldo ao vivo e envio de Pix ficam indisponíveis até conectar o banco.
          </p>
        )}

        <div className="kpi-strip grid-cols-1 sm:grid-cols-3">
          <div className="card border-l-4 border-l-navy p-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Saldo</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {saldoCents === null ? "—" : centsToReais(saldoCents)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Chave Pix</p>
            <p className="mt-2 break-all text-sm font-medium text-foreground">{conta.pixKey ?? "Pendente"}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Identificador da conta</p>
            <p className="mt-2 truncate text-sm text-foreground">{conta.username}</p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-normal text-foreground">Extrato</h2>
          <DataTable columns={EXTRATO_COLS} total={extrato.length} emptyMessage="Nenhuma movimentação nesta conta ainda.">
            {extrato.map((row) => (
              <tr key={row.starkId} className="table-row">
                <td className="text-muted-foreground">{formatDateTime(row.criadoEm)}</td>
                <td className="text-foreground">{row.description}</td>
                <td className="text-muted-foreground">{TIPO_LABEL[row.tipo] ?? row.tipo}</td>
                <td className={cn("text-right font-medium", row.amount < 0 ? "text-status-danger" : "text-status-success")}>
                  {centsToReais(row.amount)}
                </td>
              </tr>
            ))}
          </DataTable>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-normal text-foreground">Saídas (Pix)</h2>
          <DataTable columns={SOL_COLS} total={solicitacoes.length} emptyMessage="Nenhum Pix solicitado nesta conta.">
            {solicitacoes.map((s) => (
              <tr key={s.id} className="table-row">
                <td className="font-medium text-foreground">{centsToReais(s.amount)}</td>
                <td>
                  <p className="text-foreground">{s.destino.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.destino.pixKey ?? s.destino.accountNumber}</p>
                </td>
                <td className="text-muted-foreground">{s.solicitadoPorNome}</td>
                <td>
                  <span className={cn("badge border", statusClass(s.status))}>{STATUS_LABEL[s.status]}</span>
                </td>
                <td className="text-right">
                  {isMaster && s.status === "PENDENTE" && (
                    <div className="flex justify-end gap-2">
                      {s.solicitadoPor !== user?.id ? (
                        <button type="button" className="btn btn-primary btn-sm" disabled={isSaving} onClick={() => void aprovar(s.id)}>
                          Aprovar e enviar
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Aguardando outro admin</span>
                      )}
                      <button type="button" className="btn btn-secondary btn-sm" disabled={isSaving} onClick={() => void rejeitar(s.id)}>
                        Recusar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-normal text-foreground">Auditoria</h2>
          <DataTable columns={AUDIT_COLS} total={auditoria.length} emptyMessage="Sem eventos ainda.">
            {auditoria.map((a) => (
              <tr key={a.id} className="table-row">
                <td className="text-muted-foreground">{formatDateTime(a.criadoEm)}</td>
                <td className="text-foreground">{AUDIT_LABEL[a.acao] ?? a.acao}</td>
                <td className="text-muted-foreground">{a.userName}</td>
                <td className="text-muted-foreground">{a.descricao}</td>
              </tr>
            ))}
          </DataTable>
        </section>
      </div>

      <Modal
        open={showPix}
        onOpenChange={setShowPix}
        title="Solicitar Pix"
        description="O valor não sai agora. Outro admin master precisa abrir esta tela e clicar em Aprovar e enviar."
      >
        <form onSubmit={(e) => void criarSolicitacao(e)} className="space-y-5">
          <div className="form-group">
            <label className="form-label">Valor (R$)</label>
            <input
              className="input-base"
              value={form.amountReais}
              onChange={(e) => setForm((p) => ({ ...p, amountReais: e.target.value }))}
              required
              inputMode="decimal"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Chave Pix destino</label>
            <input
              className="input-base"
              value={form.pixKey}
              onChange={(e) => setForm((p) => ({ ...p, pixKey: e.target.value }))}
              required
              minLength={8}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input
              className="input-base"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              required
              minLength={5}
            />
          </div>
          {projetoId === TESOURARIA_CONTA_ID && (
            <p className="text-xs text-muted-foreground">Esta é a tesouraria da Atlas, não o caixa da obra.</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-secondary rounded-[8px]" onClick={() => setShowPix(false)}>Cancelar</button>
            <button type="submit" disabled={isSaving} className="btn btn-primary rounded-[8px]">
              {isSaving ? "Enviando…" : "Solicitar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
