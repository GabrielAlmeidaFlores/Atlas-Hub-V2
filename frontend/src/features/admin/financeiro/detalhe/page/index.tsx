import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import type {
  CartaoObraDetalhe,
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
import { formatCurrency, formatDateTime, parseMoneyInput } from "@/lib/utils";
import { cn, formatCpfCnpj, isValidCpfCnpj } from "@/lib/utils";
import { CurrencyInput } from "@/components/shared/currency-input";

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

const LIMITE_COLS = [
  { label: "Etapa" },
  { label: "Orçado", align: "right" as const },
  { label: "Limite proposto", align: "right" as const },
];

const AUDIT_LABEL: Record<string, string> = {
  CONTA_CRIADA: "Conta aberta",
  SOLICITACAO_CRIADA: "Pix solicitado",
  SOLICITACAO_APROVADA: "Pix aprovado",
  SOLICITACAO_REJEITADA: "Pix rejeitado",
  TRANSFERENCIA_EXECUTADA: "Pix enviado",
  TRANSFERENCIA_FALHOU: "Pix falhou",
  WEBHOOK_CONCILIADO: "Movimento conciliado",
  CARTAO_SOLICITADO: "Cartão solicitado",
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
  const [showSplit, setShowSplit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ amountReais: "", description: "", pixKey: "" });
  const [splitForm, setSplitForm] = useState({ name: "", taxId: "", pixKey: "" });
  const [lastSplitId, setLastSplitId] = useState<string | null>(null);
  const [cartao, setCartao] = useState<CartaoObraDetalhe | null>(null);
  const [showCartao, setShowCartao] = useState(false);
  const [cartaoChecks, setCartaoChecks] = useState({
    titularSpe: false,
    faturaIntegral: false,
    semRotativo: false,
    cashbackNaSpe: false,
  });

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
    if (detalhe.conta.tipo === "SPE") {
      try {
        setCartao(await api.get<CartaoObraDetalhe>(`/admin/financeiro/cartoes/${encoded}`));
      } catch {
        setCartao(null);
      }
    } else {
      setCartao(null);
    }
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
        amountReais: parseMoneyInput(form.amountReais),
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

  async function registrarCartao(e: FormEvent): Promise<void> {
    e.preventDefault();
    const checklistOk = cartaoChecks.titularSpe && cartaoChecks.faturaIntegral && cartaoChecks.semRotativo && cartaoChecks.cashbackNaSpe;
    if (!checklistOk) {
      addToast({ type: "error", title: "Checklist incompleto", description: "Confirme as quatro regras antes de registrar." });
      return;
    }
    setIsSaving(true);
    try {
      const result = await api.post<CartaoObraDetalhe>(`/admin/financeiro/cartoes/${encodeURIComponent(projetoId)}/solicitar`, {
        titularSpe: true,
        faturaIntegral: true,
        semRotativo: true,
        cashbackNaSpe: true,
      });
      setCartao(result);
      setShowCartao(false);
      setCartaoChecks({ titularSpe: false, faturaIntegral: false, semRotativo: false, cashbackNaSpe: false });
      addToast({ type: "success", title: "Solicitação registrada", description: "Emissão e CDI continuam bloqueados até a Stark." });
      await load();
    } catch (err) {
      addToast({ type: "error", title: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function criarSplit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!isValidCpfCnpj(splitForm.taxId)) {
      addToast({ type: "error", title: "CPF ou CNPJ inválido" });
      return;
    }
    setIsSaving(true);
    try {
      const result = await api.post<{ receiverId: string }>("/admin/financeiro/split", {
        projetoId,
        name: splitForm.name,
        taxId: splitForm.taxId.replace(/\D/g, ""),
        pixKey: splitForm.pixKey,
      });
      setLastSplitId(result.receiverId);
      addToast({ type: "success", title: "Beneficiário de split criado", description: result.receiverId });
      setShowSplit(false);
      setSplitForm({ name: "", taxId: "", pixKey: "" });
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
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-secondary btn-sm rounded-[8px]" onClick={() => setShowSplit(true)}>
                Cadastrar split
              </button>
              <button type="button" className="btn btn-primary btn-sm rounded-[8px]" onClick={() => setShowPix(true)}>
                Solicitar Pix
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="page-content space-y-6">
        {!configured && (
          <p className="alert-warn px-4 py-3 text-xs text-status-warning">
            Integração bancária não configurada. Você consulta a conta, mas saldo ao vivo e envio de Pix ficam indisponíveis até conectar o banco.
          </p>
        )}

        {lastSplitId !== null && (
          <p className="px-4 py-3 text-xs text-muted-foreground">
            Último beneficiário de split: <span className="font-medium text-foreground">{lastSplitId}</span>
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

        {cartao !== null && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold tracking-normal text-foreground">Cartão da obra</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Limite sugerido pelo orçado de cada etapa. Titular é a SPE; cashback fica na SPE; receita Atlas só por contrato comercial.
                </p>
              </div>
              <span className={cn("badge border", cartao.status === "SOLICITADO" ? "badge-aprovado" : "badge-ajuste")}>
                {cartao.status === "SOLICITADO" ? "Solicitação registrada" : "Preparação"}
              </span>
            </div>
            <p className="alert-warn px-4 py-3 text-xs text-status-warning">
              Emissão, garantia em CDI e cashback ainda não estão ligados. Esta tela só calcula o limite e registra o pedido interno.
            </p>
            <div className="kpi-strip grid-cols-1 sm:grid-cols-2">
              <div className="card border-l-4 border-l-navy p-4">
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Limite atual</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{formatCurrency(cartao.limiteTotal)}</p>
              </div>
              {cartao.limiteRegistrado !== undefined && (
                <div className="card p-4">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Limite no pedido</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{formatCurrency(cartao.limiteRegistrado)}</p>
                </div>
              )}
            </div>
            <ul className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <li>Titular: SPE</li>
              <li>Fatura: pagamento integral automático</li>
              <li>Sem crédito rotativo</li>
              <li>Cashback 1,5% para a SPE</li>
            </ul>
            <DataTable columns={LIMITE_COLS} total={cartao.limites.length} emptyMessage="Cadastre etapas no cronograma para calcular o limite.">
              {cartao.limites.map((linha) => (
                <tr key={linha.etapaId} className="table-row">
                  <td className="text-foreground">{linha.nome}</td>
                  <td className="text-right text-muted-foreground">{formatCurrency(linha.valorOrcado)}</td>
                  <td className="text-right font-medium text-foreground">{formatCurrency(linha.limiteProposto)}</td>
                </tr>
              ))}
            </DataTable>
            {cartao.cronogramaDesatualizado && (
              <p className="text-xs text-status-warning">
                O cronograma mudou depois do pedido. O limite atual é {formatCurrency(cartao.limiteTotal)}; o pedido registrou {formatCurrency(cartao.limiteRegistrado ?? 0)}.
              </p>
            )}
            {cartao.cartao?.solicitadoEm !== undefined && (
              <p className="text-xs text-muted-foreground">
                Pedido interno em {formatDateTime(cartao.cartao.solicitadoEm)}
                {cartao.cartao.solicitadoPorNome !== undefined ? ` por ${cartao.cartao.solicitadoPorNome}` : ""}.
              </p>
            )}
            {cartao.status === "PREPARACAO" && cartao.bloqueiosRegistro.length > 0 && (
              <ul className="space-y-1 text-xs text-muted-foreground">
                {cartao.bloqueiosRegistro.map((item) => (
                  <li key={item.codigo}>{item.mensagem}</li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <Link to={`/admin/cronograma/${encodeURIComponent(projetoId)}`} className="btn btn-ghost btn-sm inline-flex">
                Ver cronograma
              </Link>
              {isMaster && cartao.podeRegistrar && (
                <button type="button" className="btn btn-secondary btn-sm rounded-[8px]" disabled={isSaving} onClick={() => setShowCartao(true)}>
                  Registrar solicitação
                </button>
              )}
            </div>
          </section>
        )}

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
            <CurrencyInput
              value={form.amountReais}
              onValueChange={(v) => setForm((p) => ({ ...p, amountReais: v }))}
              required
              placeholder="0,00"
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

      <Modal
        open={showCartao}
        onOpenChange={setShowCartao}
        title="Registrar solicitação do cartão"
        description="Confirma as regras jurídicas do cartão. Isso não emite o cartão nem liga a Stark."
      >
        <form onSubmit={(e) => void registrarCartao(e)} className="space-y-5">
          <div className="space-y-2 rounded-[8px] border border-border bg-muted/40 p-3">
            {([
              { key: "titularSpe" as const, label: "O titular do cartão é a SPE da obra" },
              { key: "faturaIntegral" as const, label: "A fatura será paga integralmente, sem rotativo" },
              { key: "semRotativo" as const, label: "Não haverá crédito rotativo ou empréstimo" },
              { key: "cashbackNaSpe" as const, label: "O cashback permanece na SPE; Atlas recebe só por contrato comercial" },
            ]).map(({ key, label }) => (
              <label key={key} className="flex cursor-pointer items-start gap-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={cartaoChecks[key]}
                  onChange={(e) => setCartaoChecks((p) => ({ ...p, [key]: e.target.checked }))}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-secondary rounded-[8px]" onClick={() => setShowCartao(false)}>Cancelar</button>
            <button
              type="submit"
              disabled={isSaving || !cartaoChecks.titularSpe || !cartaoChecks.faturaIntegral || !cartaoChecks.semRotativo || !cartaoChecks.cashbackNaSpe}
              className="btn btn-primary rounded-[8px]"
            >
              {isSaving ? "Registrando…" : "Registrar"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showSplit}
        onOpenChange={setShowSplit}
        title="Cadastrar beneficiário de split"
        description="Prepara o receptor Stark para divisão operacional de recebíveis desta conta. Distribuição de rendimentos da oferta continua automática na Divify."
      >
        <form onSubmit={(e) => void criarSplit(e)} className="space-y-5">
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input
              className="input-base"
              value={splitForm.name}
              onChange={(e) => setSplitForm((p) => ({ ...p, name: e.target.value }))}
              required
              minLength={2}
            />
          </div>
          <div className="form-group">
            <label className="form-label">CPF ou CNPJ</label>
            <input
              className={cn(
                "input-base",
                (splitForm.taxId.replace(/\D/g, "").length === 11 || splitForm.taxId.replace(/\D/g, "").length === 14)
                  && !isValidCpfCnpj(splitForm.taxId)
                  && "field-error",
              )}
              value={formatCpfCnpj(splitForm.taxId)}
              onChange={(e) => setSplitForm((p) => ({ ...p, taxId: e.target.value.replace(/\D/g, "").slice(0, 14) }))}
              required
              inputMode="numeric"
              placeholder="000.000.000-00"
              maxLength={18}
            />
            {(splitForm.taxId.replace(/\D/g, "").length === 11 || splitForm.taxId.replace(/\D/g, "").length === 14)
              && !isValidCpfCnpj(splitForm.taxId) && (
              <p className="form-error">CPF ou CNPJ inválido</p>
            )}
            {isValidCpfCnpj(splitForm.taxId) && (
              <p className="mt-1 text-xs font-medium text-status-success">
                {splitForm.taxId.replace(/\D/g, "").length === 14 ? "CNPJ válido" : "CPF válido"}
              </p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Chave Pix</label>
            <input
              className="input-base"
              value={splitForm.pixKey}
              onChange={(e) => setSplitForm((p) => ({ ...p, pixKey: e.target.value }))}
              required
              minLength={8}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-secondary rounded-[8px]" onClick={() => setShowSplit(false)}>Cancelar</button>
            <button
              type="submit"
              disabled={isSaving || !isValidCpfCnpj(splitForm.taxId)}
              className="btn btn-primary rounded-[8px]"
            >
              {isSaving ? "Cadastrando…" : "Cadastrar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
