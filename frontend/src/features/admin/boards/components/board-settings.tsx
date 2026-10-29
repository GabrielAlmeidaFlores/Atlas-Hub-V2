import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { boardsApi, type TemplateFieldInput } from "@/services/boards";
import { getApiErrorMessage } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import type {
  BoardColumnColor,
  BoardFieldType,
  BoardLabelColor,
  BoardLabelDisplayMode,
  BoardTemplate,
  BoardTemplateField,
  BoardView,
} from "@/types";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useDiscardGuard } from "@/components/ui/confirm-dialog/use-discard-guard";
import { cn } from "@/lib/utils";
import { BOARD_COLUMN_COLORS, BOARD_LABEL_COLORS } from "@/types";
import { COLUMN_COLOR_CLASSES, COLUMN_COLOR_LABELS, LABEL_COLOR_CLASSES, LABEL_COLOR_LABELS } from "../labels";

interface BoardSettingsProps {
  readonly open: boolean;
  readonly board: BoardView;
  readonly onClose: () => void;
  readonly onSaved: () => Promise<void>;
}

interface FieldDraft {
  readonly fieldId?: string;
  readonly label: string;
  readonly type: BoardFieldType;
  readonly required: boolean;
  readonly options: string;
}

interface TemplateDraft {
  readonly templateId?: string;
  readonly name: string;
  readonly fields: readonly FieldDraft[];
}

type Tab = "general" | "labels" | "columns" | "templates";

function fieldDraftFrom(field: BoardTemplateField): FieldDraft {
  return {
    fieldId: field.fieldId,
    label: field.label,
    type: field.type,
    required: field.required,
    options: (field.options ?? []).join(", "),
  };
}

function emptyField(): FieldDraft {
  return { label: "", type: "text", required: false, options: "" };
}

function draftFrom(template: BoardTemplate): TemplateDraft {
  return {
    templateId: template.templateId,
    name: template.name,
    fields: template.fields.map(fieldDraftFrom),
  };
}

export function BoardSettings({ open, board, onClose, onSaved }: BoardSettingsProps): ReactNode {
  const addToast = useToastStore((s) => s.addToast);
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>("general");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boardName, setBoardName] = useState(board.board.name);
  const [boardDescription, setBoardDescription] = useState(board.board.description ?? "");
  const [labelDisplayMode, setLabelDisplayMode] = useState<BoardLabelDisplayMode>(board.board.labelDisplayMode ?? "hover");
  const [newLabel, setNewLabel] = useState("");
  const [newLabelColor, setNewLabelColor] = useState<BoardLabelColor>("blue");
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState<BoardLabelColor>("blue");
  const [newColumn, setNewColumn] = useState("");
  const [newColumnColor, setNewColumnColor] = useState<BoardColumnColor>("slate");
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [columnName, setColumnName] = useState("");
  const [columnColor, setColumnColor] = useState<BoardColumnColor>("slate");
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft | null>(null);
  const [templateInitial, setTemplateInitial] = useState<TemplateDraft | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setBoardName(board.board.name);
      setBoardDescription(board.board.description ?? "");
      setLabelDisplayMode(board.board.labelDisplayMode ?? "hover");
      setNewLabel("");
      setNewLabelColor("blue");
      setEditingLabelId(null);
      setLabelName("");
      setLabelColor("blue");
      setNewColumn("");
      setNewColumnColor("slate");
      setEditingColumnId(null);
      setColumnName("");
      setTemplateDraft(null);
      setTemplateInitial(null);
      return;
    }
    setBoardName(board.board.name);
    setBoardDescription(board.board.description ?? "");
    setLabelDisplayMode(board.board.labelDisplayMode ?? "hover");
  }, [open, board.board.boardId]);

  function startTemplate(draft: TemplateDraft): void {
    setTemplateDraft(draft);
    setTemplateInitial(draft);
  }

  function clearTemplate(): void {
    setTemplateDraft(null);
    setTemplateInitial(null);
  }

  const editingColumn = editingColumnId === null
    ? undefined
    : board.columns.find((column) => column.columnId === editingColumnId);
  const editingLabel = editingLabelId === null
    ? undefined
    : board.labels.find((label) => label.labelId === editingLabelId);
  const templateDirty = templateDraft !== null
    && JSON.stringify(templateDraft) !== JSON.stringify(templateInitial);
  const generalDirty = boardName.trim() !== board.board.name
    || boardDescription.trim() !== (board.board.description ?? "")
    || labelDisplayMode !== (board.board.labelDisplayMode ?? "hover");
  const labelsDirty = newLabel.trim().length > 0
    || newLabelColor !== "blue"
    || (editingLabel !== undefined && (labelName.trim() !== editingLabel.name || labelColor !== editingLabel.color));
  const settingsDirty = generalDirty
    || labelsDirty
    || newColumn.trim().length > 0
    || newColumnColor !== "slate"
    || (editingColumn !== undefined && (columnName.trim() !== editingColumn.name || columnColor !== (editingColumn.color ?? "slate")))
    || templateDirty;
  const closeSettings = (): void => {
    setBoardName(board.board.name);
    setBoardDescription(board.board.description ?? "");
    setLabelDisplayMode(board.board.labelDisplayMode ?? "hover");
    setNewLabel("");
    setNewLabelColor("blue");
    setEditingLabelId(null);
    setLabelName("");
    setLabelColor("blue");
    setNewColumn("");
    setNewColumnColor("slate");
    setEditingColumnId(null);
    setColumnName("");
    setColumnColor("slate");
    clearTemplate();
    setError(null);
    onClose();
  };
  const requestClose = useDiscardGuard(settingsDirty, closeSettings);

  async function execute(action: () => Promise<unknown>, message: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await action();
      await onSaved();
      addToast({ type: "success", title: message });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveGeneral(): Promise<void> {
    if (boardName.trim().length === 0) {
      setError("Informe o nome do quadro");
      return;
    }
    if (boardDescription.trim().length > 300) {
      setError("A descrição deve ter no máximo 300 caracteres");
      return;
    }
    await execute(async () => {
      await boardsApi.update(board.board.boardId, {
        name: boardName.trim(),
        description: boardDescription.trim().length > 0 ? boardDescription.trim() : null,
        labelDisplayMode,
      });
    }, "Quadro atualizado");
  }

  async function addLabel(): Promise<void> {
    if (newLabel.trim().length === 0) return;
    await execute(async () => {
      await boardsApi.createLabel(board.board.boardId, { name: newLabel.trim(), color: newLabelColor });
      setNewLabel("");
      setNewLabelColor("blue");
    }, "Label criada");
  }

  async function saveLabel(labelId: string): Promise<void> {
    if (labelName.trim().length === 0) return;
    await execute(async () => {
      await boardsApi.updateLabel(board.board.boardId, labelId, { name: labelName.trim(), color: labelColor });
      setEditingLabelId(null);
      setLabelName("");
    }, "Label atualizada");
  }

  async function deleteLabel(labelId: string): Promise<void> {
    const confirmed = await confirm({
      title: "Excluir label",
      description: "A label será removida dos cards que a utilizam. Deseja continuar?",
      confirmLabel: "Excluir label",
    });
    if (!confirmed) return;
    await execute(() => boardsApi.deleteLabel(board.board.boardId, labelId), "Label excluída");
  }

  async function addColumn(): Promise<void> {
    if (newColumn.trim().length === 0) return;
    await execute(async () => {
      await boardsApi.createColumn(board.board.boardId, { name: newColumn.trim(), color: newColumnColor });
      setNewColumn("");
      setNewColumnColor("slate");
    }, "Coluna criada");
  }

  async function renameColumn(columnId: string): Promise<void> {
    if (columnName.trim().length === 0) return;
    await execute(async () => {
      await boardsApi.updateColumn(board.board.boardId, columnId, { name: columnName.trim(), color: columnColor });
      setEditingColumnId(null);
      setColumnName("");
    }, "Coluna atualizada");
  }

  async function moveColumn(columnId: string, direction: -1 | 1): Promise<void> {
    const current = board.columns.findIndex((column) => column.columnId === columnId);
    const next = current + direction;
    if (current < 0 || next < 0 || next >= board.columns.length) return;
    await execute(
      () => boardsApi.updateColumn(board.board.boardId, columnId, { position: next }),
      "Colunas reordenadas",
    );
  }

  async function deleteColumn(columnId: string): Promise<void> {
    const confirmed = await confirm({
      title: "Excluir coluna",
      description: "Excluir esta coluna? Ela precisa estar vazia.",
      confirmLabel: "Excluir coluna",
    });
    if (!confirmed) return;
    await execute(() => boardsApi.deleteColumn(board.board.boardId, columnId), "Coluna excluída");
  }

  function updateDraftField(index: number, patch: Partial<FieldDraft>): void {
    setTemplateDraft((prev) => {
      if (prev === null) return prev;
      const fields = prev.fields.map((field, current) => current === index ? { ...field, ...patch } : field);
      return { ...prev, fields };
    });
  }

  async function saveTemplate(): Promise<void> {
    if (templateDraft === null) return;
    if (templateDraft.name.trim().length === 0) {
      setError("Informe o nome do template");
      return;
    }
    if (templateDraft.fields.length === 0 || templateDraft.fields.some((field) => field.label.trim().length === 0)) {
      setError("Informe o nome de todos os campos");
      return;
    }
    const fields: TemplateFieldInput[] = templateDraft.fields.map((field, position) => ({
      ...(field.fieldId !== undefined ? { fieldId: field.fieldId } : {}),
      label: field.label.trim(),
      type: field.type,
      required: field.required,
      position,
      ...(field.type === "select"
        ? { options: field.options.split(",").map((option) => option.trim()).filter((option) => option.length > 0) }
        : {}),
    }));
    if (fields.some((field) => field.type === "select" && (field.options ?? []).length === 0)) {
      setError("Campos de seleção precisam de opções");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (templateDraft.templateId !== undefined) {
        await boardsApi.updateTemplate(board.board.boardId, templateDraft.templateId, { name: templateDraft.name.trim(), fields });
      } else {
        await boardsApi.createTemplate(board.board.boardId, { name: templateDraft.name.trim(), fields });
      }
      clearTemplate();
      await onSaved();
      addToast({ type: "success", title: "Template salvo" });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function deleteTemplate(templateId: string): Promise<void> {
    const confirmed = await confirm({
      title: "Excluir template",
      description: "Excluir este template? Ele não pode estar em uso por nenhum card.",
      confirmLabel: "Excluir template",
    });
    if (!confirmed) return;
    await execute(() => boardsApi.deleteTemplate(board.board.boardId, templateId), "Template excluído");
  }

  return (
    <Modal open={open} onOpenChange={(next) => { if (!next) void requestClose(); }} title="Configurar quadro" className="max-h-[90vh] max-w-3xl overflow-y-auto">
      <div className="mb-5 flex gap-1 border-b border-border">
        {([
          ["general", "Geral"],
          ["labels", "Labels"],
          ["columns", "Colunas"],
          ["templates", "Templates"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === value ? "border-navy text-navy" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error !== null && <p className="mb-4 text-sm text-status-danger">{error}</p>}

      {tab === "general" && (
        <div className="space-y-4">
          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="form-group gap-1.5">
              <label className="form-label" htmlFor="board-name-config">Nome do quadro</label>
              <input
                id="board-name-config"
                className="input-base h-9"
                value={boardName}
                onChange={(event) => setBoardName(event.target.value)}
                maxLength={80}
                autoFocus
              />
            </div>
            <div className="form-group gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <label className="form-label" htmlFor="board-description-config">Descrição</label>
                <span className="text-[10px] tabular-nums text-muted-foreground">{boardDescription.length}/300</span>
              </div>
              <textarea
                id="board-description-config"
                className="input-base !h-[74px] !min-h-[74px] resize-y py-2 text-sm"
                value={boardDescription}
                onChange={(event) => setBoardDescription(event.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Objetivo e contexto deste quadro"
              />
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold text-foreground">Exibição das labels</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Como os nomes das labels aparecem nos cards.</p>
            <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-2" role="radiogroup" aria-label="Exibição das labels">
              {([
                ["hover", "Expandir ao passar o mouse", "O card fica compacto e mostra os nomes no hover."],
                ["expanded", "Sempre expandidas", "Os nomes das labels ficam visíveis o tempo todo."],
              ] as const).map(([value, title, description]) => (
                <label key={value} className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name="label-display-mode"
                    className="sr-only"
                    checked={labelDisplayMode === value}
                    onChange={() => setLabelDisplayMode(value)}
                  />
                  <span className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                    labelDisplayMode === value ? "border-navy bg-navy" : "border-border bg-card",
                  )}>
                    {labelDisplayMode === value && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span>{title}</span>
                  <span className="sr-only">{description}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {labelDisplayMode === "hover"
                ? "O card fica compacto e mostra os nomes no hover."
                : "Os nomes das labels ficam visíveis o tempo todo."}
            </p>
          </div>

          <div className="flex justify-end border-t border-border pt-3">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void saveGeneral()} disabled={busy || !generalDirty}>
              {busy ? "Salvando…" : "Salvar configurações"}
            </button>
          </div>
        </div>
      )}

      {tab === "labels" && (
        <div className="space-y-4">
          <div className="space-y-2 rounded-[8px] border border-border p-3">
            <div className="flex gap-2">
              <input
                className="input-base"
                placeholder="Nova label"
                value={newLabel}
                onChange={(event) => setNewLabel(event.target.value)}
                maxLength={40}
              />
              <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={() => void addLabel()} disabled={busy || newLabel.trim().length === 0}>
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] text-muted-foreground">Cor</span>
              {BOARD_LABEL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Cor ${LABEL_COLOR_LABELS[color]}`}
                  title={LABEL_COLOR_LABELS[color]}
                  onClick={() => setNewLabelColor(color)}
                  className={cn(
                    "h-5 w-5 rounded-full border transition-transform",
                    LABEL_COLOR_CLASSES[color],
                    newLabelColor === color ? "ring-2 ring-navy ring-offset-1" : "hover:scale-110",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="divide-y divide-border rounded-[8px] border border-border">
            {board.labels.map((label) => {
              const usage = board.cards.filter((card) => card.labelIds.includes(label.labelId)).length;
              return (
                <div key={label.labelId} className="flex items-center gap-2 p-3">
                  {editingLabelId === label.labelId ? (
                    <>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <input className="input-base h-9 min-w-0 flex-1" value={labelName} onChange={(event) => setLabelName(event.target.value)} maxLength={40} autoFocus />
                          <button type="button" className="btn btn-primary btn-sm h-9 w-9 shrink-0 p-0" onClick={() => void saveLabel(label.labelId)} disabled={busy} aria-label="Confirmar label"><Check className="h-3.5 w-3.5" /></button>
                          <button type="button" className="btn btn-outline btn-sm h-9 w-9 shrink-0 p-0" onClick={() => setEditingLabelId(null)} aria-label="Cancelar edição da label"><X className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {BOARD_LABEL_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              aria-label={`Cor ${LABEL_COLOR_LABELS[color]}`}
                              title={LABEL_COLOR_LABELS[color]}
                              onClick={() => setLabelColor(color)}
                              className={cn(
                                "h-5 w-5 rounded-full border transition-transform",
                                LABEL_COLOR_CLASSES[color],
                                labelColor === color ? "ring-2 ring-navy ring-offset-1" : "hover:scale-110",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className={cn("h-3 w-3 shrink-0 rounded-full border", LABEL_COLOR_CLASSES[label.color])} />
                      <span className="flex-1 font-medium text-foreground">{label.name}</span>
                      <span className="text-[10px] text-muted-foreground">{usage} card{usage === 1 ? "" : "s"}</span>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => { setEditingLabelId(label.labelId); setLabelName(label.name); setLabelColor(label.color); }} disabled={busy}><Pencil className="h-3.5 w-3.5" /></button>
                      <button type="button" className="btn btn-outline btn-sm text-status-danger" onClick={() => void deleteLabel(label.labelId)} disabled={busy}><Trash2 className="h-3.5 w-3.5" /></button>
                    </>
                  )}
                </div>
              );
            })}
            {board.labels.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhuma label criada.</p>}
          </div>
        </div>
      )}

      {tab === "columns" && (
        <div className="space-y-4">
          <div className="space-y-2 rounded-[8px] border border-border p-3">
            <div className="flex gap-2">
              <input className="input-base" placeholder="Nova coluna" value={newColumn} onChange={(event) => setNewColumn(event.target.value)} maxLength={80} />
              <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={() => void addColumn()} disabled={busy}>
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] text-muted-foreground">Cor</span>
              {BOARD_COLUMN_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Cor ${COLUMN_COLOR_LABELS[color]}`}
                  title={COLUMN_COLOR_LABELS[color]}
                  onClick={() => setNewColumnColor(color)}
                  className={cn(
                    "h-5 w-5 rounded-[4px] border transition-transform",
                    COLUMN_COLOR_CLASSES[color],
                    newColumnColor === color ? "ring-2 ring-navy ring-offset-1" : "hover:scale-110",
                  )}
                />
              ))}
            </div>
          </div>
          <div className="divide-y divide-border rounded-[8px] border border-border">
            {board.columns.map((column, index) => (
              <div key={column.columnId} className="flex items-center gap-2 p-3">
                {editingColumnId === column.columnId ? (
                  <>
                    <div className="flex-1 space-y-2">
                      <input className="input-base" value={columnName} onChange={(event) => setColumnName(event.target.value)} autoFocus />
                      <div className="flex flex-wrap gap-1.5">
                        {BOARD_COLUMN_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            aria-label={`Cor ${COLUMN_COLOR_LABELS[color]}`}
                            title={COLUMN_COLOR_LABELS[color]}
                            onClick={() => setColumnColor(color)}
                            className={cn(
                              "h-5 w-5 rounded-[4px] border transition-transform",
                              COLUMN_COLOR_CLASSES[color],
                              columnColor === color ? "ring-2 ring-navy ring-offset-1" : "hover:scale-110",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => void renameColumn(column.columnId)} disabled={busy}><Check className="h-3.5 w-3.5" /></button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingColumnId(null)}><X className="h-3.5 w-3.5" /></button>
                  </>
                ) : (
                  <>
                    <span className={cn("h-3 w-3 shrink-0 rounded-full border", COLUMN_COLOR_CLASSES[column.color ?? "slate"])} />
                    <span className="flex-1 font-medium text-foreground">{column.name}</span>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => { setEditingColumnId(column.columnId); setColumnName(column.name); setColumnColor(column.color ?? "slate"); }} disabled={busy}><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => void moveColumn(column.columnId, -1)} disabled={busy || index === 0}><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => void moveColumn(column.columnId, 1)} disabled={busy || index === board.columns.length - 1}><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button type="button" className="btn btn-outline btn-sm text-status-danger" onClick={() => void deleteColumn(column.columnId)} disabled={busy}><Trash2 className="h-3.5 w-3.5" /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "templates" && (
        <div className="space-y-4">
          {templateDraft === null ? (
            <>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => startTemplate({ name: "", fields: [emptyField()] })}
                disabled={busy}
              >
                <Plus className="h-3.5 w-3.5" /> Novo template
              </button>
              <div className="divide-y divide-border rounded-[8px] border border-border">
                {board.templates.map((template) => (
                  <div key={template.templateId} className="flex items-center gap-2 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.fields.length} campo(s)</p>
                    </div>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => startTemplate(draftFrom(template))} disabled={busy}><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" className="btn btn-outline btn-sm text-status-danger" onClick={() => void deleteTemplate(template.templateId)} disabled={busy}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                {board.templates.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhum template criado.</p>}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="template-name">Nome do template</label>
                <input id="template-name" className="input-base" value={templateDraft.name} onChange={(event) => setTemplateDraft({ ...templateDraft, name: event.target.value })} maxLength={80} />
              </div>
              <div className="space-y-3">
                {templateDraft.fields.map((field, index) => (
                  <div key={field.fieldId ?? `field-${String(index)}`} className="rounded-[8px] border border-border p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_150px_auto_auto]">
                      <input className="input-base" placeholder="Nome do campo" value={field.label} onChange={(event) => updateDraftField(index, { label: event.target.value })} maxLength={80} />
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateDraftField(index, { type: value as BoardFieldType })}
                        options={(["text", "longText", "number", "date", "checkbox", "select", "phone", "email", "url", "file", "files"] as const).map((type) => ({ value: type, label: type === "file" ? "Arquivo" : type === "files" ? "Arquivos" : type }))}
                      />
                      <Checkbox
                        checked={field.required}
                        onChange={(checked) => updateDraftField(index, { required: checked })}
                        label="Obrigatório"
                        className="items-center whitespace-nowrap text-xs text-muted-foreground"
                      />
                      <button type="button" className="btn btn-outline btn-sm text-status-danger" onClick={() => setTemplateDraft({ ...templateDraft, fields: templateDraft.fields.filter((_, current) => current !== index) })} disabled={templateDraft.fields.length === 1}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    {field.type === "select" && (
                      <input className="input-base mt-2" placeholder="Opções separadas por vírgula" value={field.options} onChange={(event) => updateDraftField(index, { options: event.target.value })} />
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setTemplateDraft({ ...templateDraft, fields: [...templateDraft.fields, emptyField()] })} disabled={busy}><Plus className="h-3.5 w-3.5" /> Adicionar campo</button>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button type="button" className="btn btn-secondary" onClick={clearTemplate} disabled={busy}>Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={() => void saveTemplate()} disabled={busy}>{busy ? "Salvando…" : "Salvar template"}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
