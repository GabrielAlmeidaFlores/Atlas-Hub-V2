import { useState, type FormEvent, type ReactNode } from "react";
import { CalendarRange, Plus, Wallet } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import { uploadProjetoDocumento } from "@/lib/upload";
import { deleteDocumento } from "@/lib/documents";
import { useToastStore } from "@/stores/toast";
import type { CronogramaDetalhe, EtapaCronograma, LancamentoObra } from "@/types";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useDiscardGuard } from "@/components/ui/confirm-dialog/use-discard-guard";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { CurrencyInput } from "@/components/shared/currency-input";
import { DocumentLink } from "@/components/shared/document-link";
import { formatCurrency, parseMoneyInput, formatMoneyFromNumber, cn } from "@/lib/utils";
import {
  STATUS_ETAPA_LABEL,
  SITUACAO_LABEL,
  statusEtapaClass,
  situacaoClass,
  formatDateYmd,
  formatDesvioDias,
} from "@/lib/cronograma";

const ETAPA_COLS = [
  { label: "Etapa" },
  { label: "Prazo" },
  { label: "Físico" },
  { label: "Orçado", align: "right" as const },
  { label: "Realizado", align: "right" as const },
  { label: "Saldo", align: "right" as const },
  { label: "" },
];

const GASTO_COLS = [
  { label: "Data" },
  { label: "Despesa" },
  { label: "Etapa" },
  { label: "Valor", align: "right" as const },
  { label: "" },
];

interface Props {
  readonly data: CronogramaDetalhe;
  readonly onReload: () => Promise<void>;
}

interface EtapaForm {
  nome: string;
  inicioPrevisto: string;
  fimPrevisto: string;
  inicioReal: string;
  fimReal: string;
  percentualExecucao: string;
  valorOrcado: string;
}

interface GastoForm {
  etapaId: string;
  descricao: string;
  valor: string;
  dataLancamento: string;
}

const ETAPA_VAZIA: EtapaForm = {
  nome: "",
  inicioPrevisto: "",
  fimPrevisto: "",
  inicioReal: "",
  fimReal: "",
  percentualExecucao: "0",
  valorOrcado: "",
};

function etapaToForm(etapa: EtapaCronograma): EtapaForm {
  return {
    nome: etapa.nome,
    inicioPrevisto: etapa.inicioPrevisto,
    fimPrevisto: etapa.fimPrevisto,
    inicioReal: etapa.inicioReal ?? "",
    fimReal: etapa.fimReal ?? "",
    percentualExecucao: String(etapa.percentualExecucao),
    valorOrcado: formatMoneyFromNumber(etapa.valorOrcado),
  };
}

function Field({ label, children }: { readonly label: string; readonly children: ReactNode }): ReactNode {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">{label}</span>
      {children}
    </label>
  );
}

export function CronogramaPainel({ data, onReload }: Props): ReactNode {
  const confirm = useConfirm();
  const addToast = useToastStore((s) => s.addToast);
  const [etapaOpen, setEtapaOpen] = useState(false);
  const [gastoOpen, setGastoOpen] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<EtapaCronograma | null>(null);
  const [etapaForm, setEtapaForm] = useState<EtapaForm>(ETAPA_VAZIA);
  const [etapaInitial, setEtapaInitial] = useState<EtapaForm>(ETAPA_VAZIA);
  const [gastoForm, setGastoForm] = useState<GastoForm>({
    etapaId: "",
    descricao: "",
    valor: "",
    dataLancamento: new Date().toISOString().slice(0, 10),
  });
  const [gastoInitial, setGastoInitial] = useState<GastoForm>({
    etapaId: "",
    descricao: "",
    valor: "",
    dataLancamento: new Date().toISOString().slice(0, 10),
  });
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const { resumo, etapas, lancamentos, podeEditarEtapas, podeLancarGastos } = data;
  const ativos = lancamentos.filter((item) => item.status === "CONFIRMADO");

  function openNovaEtapa(): void {
    setEditingEtapa(null);
    setEtapaForm(ETAPA_VAZIA);
    setEtapaInitial(ETAPA_VAZIA);
    setEtapaOpen(true);
  }

  function openEditarEtapa(etapa: EtapaCronograma): void {
    setEditingEtapa(etapa);
    const next = etapaToForm(etapa);
    setEtapaForm(next);
    setEtapaInitial(next);
    setEtapaOpen(true);
  }

  function openNovoGasto(): void {
    const primeira = etapas[0];
    if (primeira === undefined) {
      addToast({ type: "error", title: "Cadastre uma etapa antes de lançar gastos" });
      return;
    }
    const next = {
      etapaId: primeira.etapaId,
      descricao: "",
      valor: "",
      dataLancamento: new Date().toISOString().slice(0, 10),
    };
    setGastoForm(next);
    setGastoInitial(next);
    setComprovante(null);
    setGastoOpen(true);
  }

  const etapaDirty = etapaOpen && JSON.stringify(etapaForm) !== JSON.stringify(etapaInitial);
  const gastoDirty = gastoOpen && (JSON.stringify(gastoForm) !== JSON.stringify(gastoInitial) || comprovante !== null);
  const requestCloseEtapa = useDiscardGuard(etapaDirty, () => {
    setEtapaOpen(false);
    setComprovante(null);
  });
  const requestCloseGasto = useDiscardGuard(gastoDirty, () => {
    setGastoOpen(false);
    setComprovante(null);
  });

  async function saveEtapa(e: FormEvent): Promise<void> {
    e.preventDefault();
    const valorOrcado = parseMoneyInput(etapaForm.valorOrcado);
    const percentual = Number(etapaForm.percentualExecucao);
    if (!Number.isFinite(valorOrcado) || valorOrcado < 0) {
      addToast({ type: "error", title: "Informe o valor orçado" });
      return;
    }
    if (!Number.isFinite(percentual) || percentual < 0 || percentual > 100) {
      addToast({ type: "error", title: "Percentual deve estar entre 0 e 100" });
      return;
    }
    if (etapaForm.inicioPrevisto !== "" && etapaForm.fimPrevisto !== "" && etapaForm.inicioPrevisto > etapaForm.fimPrevisto) {
      addToast({ type: "error", title: "Data de início posterior ao fim" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: etapaForm.nome.trim(),
        inicioPrevisto: etapaForm.inicioPrevisto,
        fimPrevisto: etapaForm.fimPrevisto,
        percentualExecucao: percentual,
        valorOrcado,
        ...(editingEtapa === null
          ? {
              ...(etapaForm.inicioReal !== "" ? { inicioReal: etapaForm.inicioReal } : {}),
              ...(etapaForm.fimReal !== "" ? { fimReal: etapaForm.fimReal } : {}),
            }
          : {
              inicioReal: etapaForm.inicioReal,
              fimReal: etapaForm.fimReal,
            }),
      };
      if (editingEtapa === null) {
        await api.post(`/projetos/${data.projeto.id}/cronograma/etapas`, payload);
      } else {
        await api.put(`/projetos/${data.projeto.id}/cronograma/etapas/${editingEtapa.etapaId}`, payload);
      }
      addToast({ type: "success", title: editingEtapa === null ? "Etapa cadastrada" : "Etapa atualizada" });
      setEtapaOpen(false);
      await onReload();
    } catch (err) {
      addToast({ type: "error", title: "Não foi possível salvar a etapa", description: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function removeEtapa(etapa: EtapaCronograma): Promise<void> {
    const confirmed = await confirm({
      title: "Excluir etapa",
      description: `Excluir a etapa ${etapa.nome}?`,
      confirmLabel: "Excluir etapa",
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      await api.delete(`/projetos/${data.projeto.id}/cronograma/etapas/${etapa.etapaId}`);
      addToast({ type: "success", title: "Etapa excluída" });
      await onReload();
    } catch (err) {
      addToast({ type: "error", title: "Não foi possível excluir", description: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function saveGasto(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (gastoForm.etapaId === "") {
      addToast({ type: "error", title: "Selecione a etapa" });
      return;
    }
    const valor = parseMoneyInput(gastoForm.valor);
    if (!Number.isFinite(valor) || valor <= 0) {
      addToast({ type: "error", title: "Informe um valor válido" });
      return;
    }
    setSaving(true);
    try {
      let comprovanteUrl: string | undefined;
      if (comprovante !== null) {
        comprovanteUrl = await uploadProjetoDocumento(data.projeto.id, comprovante);
      }
      try {
        await api.post(`/projetos/${data.projeto.id}/cronograma/lancamentos`, {
          etapaId: gastoForm.etapaId,
          descricao: gastoForm.descricao.trim(),
          valor,
          dataLancamento: gastoForm.dataLancamento,
          ...(comprovanteUrl !== undefined ? { comprovanteUrl } : {}),
        });
      } catch (err) {
        if (comprovanteUrl !== undefined) {
          void deleteDocumento(comprovanteUrl).catch(() => undefined);
        }
        throw err;
      }
      addToast({ type: "success", title: "Gasto registrado" });
      setGastoOpen(false);
      setComprovante(null);
      await onReload();
    } catch (err) {
      addToast({ type: "error", title: "Não foi possível lançar o gasto", description: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function cancelarGasto(item: LancamentoObra): Promise<void> {
    const confirmed = await confirm({
      title: "Cancelar lançamento",
      description: "Cancelar este lançamento?",
      confirmLabel: "Cancelar lançamento",
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      await api.put(`/projetos/${data.projeto.id}/cronograma/lancamentos/${item.lancamentoId}`, { status: "CANCELADO" });
      addToast({ type: "success", title: "Lançamento cancelado" });
      await onReload();
    } catch (err) {
      addToast({ type: "error", title: "Não foi possível cancelar", description: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  function nomeEtapa(etapaId: string): string {
    return etapas.find((etapa) => etapa.etapaId === etapaId)?.nome ?? "Etapa";
  }

  return (
    <div className="space-y-7">
      <div className="kpi-strip grid-cols-2 lg:grid-cols-4">
        <StatCard label="Avanço físico" value={`${String(resumo.percentualAvanco)}%`} icon={CalendarRange} accent="navy" sublabel={`${String(resumo.etapasConcluidas)} concluídas · ${String(resumo.etapasAtrasadas)} atrasadas`} />
        <StatCard label="Orçado" value={formatCurrency(resumo.valorOrcado)} icon={Wallet} accent="neutral" />
        <StatCard label="Realizado" value={formatCurrency(resumo.valorRealizado)} accent={resumo.situacaoOrcamento === "ESTOURO" ? "danger" : "info"} sublabel={`${String(resumo.percentualRealizado)}% do orçado`} />
        <StatCard label="Saldo" value={formatCurrency(resumo.saldo)} accent={resumo.saldo < 0 ? "danger" : "success"} sublabel={SITUACAO_LABEL[resumo.situacaoOrcamento]} />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Etapas da obra</h2>
          {podeEditarEtapas && (
            <button type="button" className="btn btn-primary btn-sm rounded-[8px]" onClick={openNovaEtapa}>
              <Plus className="h-4 w-4" /> Nova etapa
            </button>
          )}
        </div>
        {etapas.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="Nenhuma etapa cadastrada"
            description="Cadastre as etapas da obra com prazo previsto e valor orçado."
          />
        ) : (
          <DataTable columns={ETAPA_COLS} total={etapas.length} minWidth={920}>
            {etapas.map((etapa) => (
              <tr key={etapa.etapaId}>
                <td className="px-5 py-3 align-top">
                  <p className="font-medium text-foreground">{etapa.nome}</p>
                  <span className={cn("mt-1.5 whitespace-nowrap", statusEtapaClass(etapa.statusExibicao))}>{STATUS_ETAPA_LABEL[etapa.statusExibicao]}</span>
                </td>
                <td className="px-5 py-3 align-top text-xs text-muted-foreground">
                  <p>Previsto: {formatDateYmd(etapa.inicioPrevisto)} a {formatDateYmd(etapa.fimPrevisto)}</p>
                  <p>Real: {formatDateYmd(etapa.inicioReal)} a {formatDateYmd(etapa.fimReal)}</p>
                  <p className={cn("mt-1 font-medium", etapa.desvioDias > 0 ? "text-status-danger" : "text-foreground")}>{formatDesvioDias(etapa.desvioDias)}</p>
                </td>
                <td className="px-5 py-3 align-top">
                  <div className="h-1.5 w-24 bg-muted">
                    <div className="h-1.5 bg-navy" style={{ width: `${String(Math.min(100, etapa.percentualExecucao))}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-medium">{String(etapa.percentualExecucao)}%</p>
                </td>
                <td className="px-5 py-3 text-right font-medium">{formatCurrency(etapa.valorOrcado)}</td>
                <td className="px-5 py-3 text-right font-medium">{formatCurrency(etapa.valorRealizado)}</td>
                <td className={cn("px-5 py-3 text-right font-medium", etapa.saldo < 0 ? "text-status-danger" : "text-foreground")}>
                  {formatCurrency(etapa.saldo)}
                  <p className="mt-1.5">
                    <span className={cn("whitespace-nowrap px-3 py-1", situacaoClass(etapa.situacaoOrcamento))}>
                      {SITUACAO_LABEL[etapa.situacaoOrcamento]}
                    </span>
                  </p>
                </td>
                <td className="px-5 py-3 text-right">
                  {podeEditarEtapas && (
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEditarEtapa(etapa)}>Editar</button>
                      <button type="button" className="btn btn-ghost btn-sm text-destructive" onClick={() => void removeEtapa(etapa)}>Excluir</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Gastos realizados</h2>
          {podeLancarGastos && (
            <button type="button" className="btn btn-navy btn-sm rounded-[8px]" onClick={openNovoGasto}>
              <Plus className="h-4 w-4" /> Lançar gasto
            </button>
          )}
        </div>
        {!podeLancarGastos && data.podeEditarEtapas && (
          <p className="text-xs text-muted-foreground">O lançamento de gastos libera após a aprovação do projeto.</p>
        )}
        {ativos.length === 0 ? (
          <EmptyState icon={Wallet} title="Nenhum gasto lançado" description="Cada despesa fica vinculada a uma etapa." />
        ) : (
          <DataTable columns={GASTO_COLS} total={ativos.length} minWidth={720}>
            {ativos.map((item) => (
              <tr key={item.lancamentoId}>
                <td className="px-5 py-3 text-xs text-muted-foreground">{formatDateYmd(item.dataLancamento)}</td>
                <td className="px-5 py-3">
                  <p className="font-medium">{item.descricao}</p>
                  {item.comprovanteUrl !== undefined && (
                    <div className="mt-2 max-w-xs">
                      <DocumentLink href={item.comprovanteUrl} label="Comprovante" />
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 text-sm">{nomeEtapa(item.etapaId)}</td>
                <td className="px-5 py-3 text-right font-medium">{formatCurrency(item.valor)}</td>
                <td className="px-5 py-3 text-right">
                  {podeLancarGastos && (
                    <button type="button" className="btn btn-ghost btn-sm text-destructive" onClick={() => void cancelarGasto(item)}>Cancelar</button>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </section>

      <Modal open={etapaOpen} onOpenChange={(next) => { if (!next) void requestCloseEtapa(); }} title={editingEtapa === null ? "Nova etapa" : "Editar etapa"} className="max-w-xl">
        <form className="space-y-4" onSubmit={(e) => void saveEtapa(e)}>
          <Field label="Nome">
            <input className="input-base" required maxLength={120} value={etapaForm.nome} onChange={(e) => setEtapaForm((p) => ({ ...p, nome: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Início previsto">
              <DatePicker value={etapaForm.inicioPrevisto} onValueChange={(value) => setEtapaForm((p) => ({ ...p, inicioPrevisto: value }))} required ariaLabel="Início previsto" />
            </Field>
            <Field label="Término previsto">
              <DatePicker value={etapaForm.fimPrevisto} onValueChange={(value) => setEtapaForm((p) => ({ ...p, fimPrevisto: value }))} required ariaLabel="Término previsto" />
            </Field>
            <Field label="Início real">
              <DatePicker value={etapaForm.inicioReal} onValueChange={(value) => setEtapaForm((p) => ({ ...p, inicioReal: value }))} ariaLabel="Início real" />
            </Field>
            <Field label="Término real">
              <DatePicker value={etapaForm.fimReal} onValueChange={(value) => setEtapaForm((p) => ({ ...p, fimReal: value }))} ariaLabel="Término real" />
            </Field>
            <Field label="% execução">
              <input type="number" min={0} max={100} className="input-base" value={etapaForm.percentualExecucao} onChange={(e) => setEtapaForm((p) => ({ ...p, percentualExecucao: e.target.value }))} />
            </Field>
            <Field label="Valor orçado (R$)">
              <CurrencyInput required value={etapaForm.valorOrcado} onValueChange={(v) => setEtapaForm((p) => ({ ...p, valorOrcado: v }))} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => void requestCloseEtapa()}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={gastoOpen} onOpenChange={(next) => { if (!next) void requestCloseGasto(); }} title="Lançar gasto" className="max-w-xl">
        <form className="space-y-4" onSubmit={(e) => void saveGasto(e)}>
          <Field label="Etapa">
            <Select
              value={gastoForm.etapaId}
              onValueChange={(value) => setGastoForm((p) => ({ ...p, etapaId: value }))}
              options={etapas.map((etapa) => ({ value: etapa.etapaId, label: etapa.nome }))}
              required
              ariaLabel="Etapa"
            />
          </Field>
          <Field label="Despesa">
            <input className="input-base" required maxLength={200} value={gastoForm.descricao} onChange={(e) => setGastoForm((p) => ({ ...p, descricao: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor (R$)">
              <CurrencyInput required value={gastoForm.valor} onValueChange={(v) => setGastoForm((p) => ({ ...p, valor: v }))} />
            </Field>
            <Field label="Data">
              <DatePicker value={gastoForm.dataLancamento} onValueChange={(value) => setGastoForm((p) => ({ ...p, dataLancamento: value }))} required ariaLabel="Data" />
            </Field>
          </div>
          <Field label="Comprovante (opcional)">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-sm" onChange={(e) => setComprovante(e.target.files?.[0] ?? null)} />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => void requestCloseGasto()}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Salvando…" : "Lançar"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
