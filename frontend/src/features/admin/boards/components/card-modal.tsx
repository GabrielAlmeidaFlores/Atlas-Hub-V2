import { useEffect, useState, type ReactNode } from "react";
import { AlertCircle, Archive, ArrowRightLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { boardsApi } from "@/services/boards";
import { getApiErrorMessage, getApiErrorFields } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import type {
  BoardCard,
  BoardCardHistoryAction,
  BoardFieldValue,
  BoardTemplateField,
  BoardView,
} from "@/types";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { cn, formatDateTime } from "@/lib/utils";
import { LabelPicker } from "./label-picker";
import { FileField } from "./file-field";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { AssigneePicker } from "./assignee-picker";
import { boardParticipants } from "../participants";

interface CardFormSnapshot {
  readonly title: string;
  readonly description: string;
  readonly columnId: string;
  readonly templateId: string;
  readonly fieldValues: Record<string, BoardFieldValue>;
  readonly labelIds: readonly string[];
  readonly assigneeEmails: readonly string[];
}

function sameSelection(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
}

function fieldValuesKey(values: Readonly<Record<string, BoardFieldValue>>): string {
  return JSON.stringify(Object.keys(values).sort().map((key) => [key, values[key]]));
}

function historyLabel(action: BoardCardHistoryAction): string {
  if (action === "created") return "Card criado";
  if (action === "updated") return "Card atualizado";
  if (action === "moved") return "Card movimentado";
  return "Card arquivado";
}

function HistoryIcon({ action }: { readonly action: BoardCardHistoryAction }): ReactNode {
  if (action === "created") return <Plus className="h-3 w-3" />;
  if (action === "updated") return <Pencil className="h-3 w-3" />;
  if (action === "moved") return <ArrowRightLeft className="h-3 w-3" />;
  return <Archive className="h-3 w-3" />;
}

interface CardModalProps {
  readonly open: boolean;
  readonly board: BoardView;
  readonly card?: BoardCard;
  readonly initialColumnId?: string;
  readonly onClose: () => void;
  readonly onSaved: () => Promise<void>;
  readonly readOnly?: boolean;
}

function fieldInputValue(value: BoardFieldValue | undefined): string {
  if (value === undefined || value === null || typeof value === "boolean") return "";
  return String(value);
}

function renderField(
  field: BoardTemplateField,
  value: BoardFieldValue | undefined,
  error: string | undefined,
  boardId: string,
  onChange: (value: BoardFieldValue) => void,
  disabled = false,
): ReactNode {
  const invalid = error !== undefined;
  const inputClass = cn("input-base", invalid && "border-status-danger focus:border-status-danger");
  if (field.type === "file" || field.type === "files") {
    return (
      <FileField
        boardId={boardId}
        value={value}
        multiple={field.type === "files"}
        onChange={onChange}
        invalid={invalid}
        disabled={disabled}
      />
    );
  }
  if (field.type === "longText") {
    return (
      <textarea
        id={`field-${field.fieldId}`}
        className={cn("input-base min-h-[90px] resize-y", invalid && "border-status-danger focus:border-status-danger")}
        aria-invalid={invalid}
        value={fieldInputValue(value)}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    );
  }
  if (field.type === "select") {
    return (
      <Select
        id={`field-${field.fieldId}`}
        value={fieldInputValue(value)}
        onValueChange={onChange}
        options={(field.options ?? []).map((option) => ({ value: option, label: option }))}
        className={invalid ? "border-status-danger focus:border-status-danger" : undefined}
        disabled={disabled}
      />
    );
  }
  if (field.type === "checkbox") {
    return (
      <div className={cn("field flex items-center", invalid && "field-error")}>
        <Checkbox
          id={`field-${field.fieldId}`}
          checked={value === true}
          onChange={onChange}
          label="Sim"
          invalid={invalid}
          disabled={disabled}
        />
      </div>
    );
  }
  if (field.type === "number") {
    return (
      <input
        id={`field-${field.fieldId}`}
        type="number"
        className={inputClass}
        aria-invalid={invalid}
        value={fieldInputValue(value)}
        onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value))}
        disabled={disabled}
      />
    );
  }
  if (field.type === "date") {
    return (
      <DatePicker
        id={`field-${field.fieldId}`}
        value={fieldInputValue(value)}
        onValueChange={onChange}
        className={invalid ? "border-status-danger focus:border-status-danger" : undefined}
        ariaLabel={field.label}
        disabled={disabled}
      />
    );
  }
  const type = field.type === "email" ? "email" : field.type === "url" ? "url" : field.type === "phone" ? "tel" : "text";
  return (
    <input
      id={`field-${field.fieldId}`}
      type={type}
      className={inputClass}
      aria-invalid={invalid}
      value={fieldInputValue(value)}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
    />
  );
}

export function CardModal({
  open,
  board,
  card,
  initialColumnId,
  onClose,
  onSaved,
  readOnly = false,
}: CardModalProps): ReactNode {
  const addToast = useToastStore((s) => s.addToast);
  const confirm = useConfirm();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, BoardFieldValue>>({});
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [assigneeEmails, setAssigneeEmails] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [initial, setInitial] = useState<CardFormSnapshot | null>(null);

  useEffect(() => {
    if (!open) return;
    const participantEmails = new Set(boardParticipants(board).map((participant) => participant.email));
    const next: CardFormSnapshot = {
      title: card?.title ?? "",
      description: card?.description ?? "",
      columnId: card?.columnId ?? initialColumnId ?? board.columns[0]?.columnId ?? "",
      templateId: card !== undefined ? (card.templateId ?? "") : (board.templates[0]?.templateId ?? ""),
      fieldValues: card?.fieldValues !== undefined ? { ...card.fieldValues } : {},
      labelIds: card?.labelIds !== undefined ? [...card.labelIds] : [],
      assigneeEmails: (card?.assigneeEmails ?? []).filter((email) => participantEmails.has(email)),
    };
    setTitle(next.title);
    setDescription(next.description);
    setColumnId(next.columnId);
    setTemplateId(next.templateId);
    setFieldValues({ ...next.fieldValues });
    setLabelIds([...next.labelIds]);
    setAssigneeEmails([...next.assigneeEmails]);
    setInitial(next);
    setError(null);
    setFieldErrors({});
  }, [open, card, initialColumnId]);

  const selectedTemplate = board.templates.find((template) => template.templateId === templateId);
  const historyEntries = card === undefined
    ? []
    : card.history !== undefined && card.history.length > 0
      ? [...card.history].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : [
          { historyId: "created", action: "created" as const, description: "Card criado", userId: card.createdBy, createdAt: card.createdAt },
          ...(card.updatedAt !== card.createdAt
            ? [{ historyId: "updated", action: "updated" as const, description: "Última atualização registrada", userId: card.updatedBy, createdAt: card.updatedAt }]
            : []),
        ];

  function clearFieldError(key: string): void {
    setFieldErrors((prev) => {
      if (prev[key] === undefined) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function updateField(fieldId: string, value: BoardFieldValue): void {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    clearFieldError(`field-${fieldId}`);
  }

  const isDirty = initial !== null && !readOnly && (
    title !== initial.title
    || description !== initial.description
    || columnId !== initial.columnId
    || templateId !== initial.templateId
    || fieldValuesKey(fieldValues) !== fieldValuesKey(initial.fieldValues)
    || !sameSelection(labelIds, initial.labelIds)
    || !sameSelection(assigneeEmails, initial.assigneeEmails)
  );

  async function requestClose(): Promise<void> {
    if (isSaving) return;
    if (!isDirty) {
      onClose();
      return;
    }
    const discard = await confirm({
      title: card !== undefined ? "Descartar alterações?" : "Descartar novo card?",
      description: "Você tem alterações não salvas. Se sair agora, elas serão perdidas.",
      confirmLabel: "Sair sem salvar",
      cancelLabel: "Continuar editando",
    });
    if (discard) onClose();
  }

  async function handleSave(): Promise<void> {
    if (readOnly) return;
    const nextErrors: Record<string, string> = {};
    if (title.trim().length === 0) nextErrors.title = "Informe o título do card";
    if (columnId.length === 0) nextErrors.columnId = "Selecione uma coluna";
    if (selectedTemplate !== undefined) {
      for (const field of selectedTemplate.fields) {
        const value = fieldValues[field.fieldId];
        const empty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
        if (field.required && empty) nextErrors[`field-${field.fieldId}`] = `${field.label} é obrigatório`;
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("Corrija os campos destacados para salvar o card.");
      return;
    }
    setIsSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const input = {
        title: title.trim(),
        description: description.trim().length > 0 ? description : undefined,
        templateId: templateId.length > 0 ? templateId : undefined,
        fieldValues,
        labelIds,
        assigneeEmails,
      };
      if (card !== undefined) {
        await boardsApi.updateCard(board.board.boardId, card.cardId, {
          title: input.title,
          description: input.description ?? null,
          templateId: input.templateId ?? null,
          fieldValues: input.fieldValues,
          labelIds: input.labelIds,
          assigneeEmails: input.assigneeEmails,
        });
        if (card.columnId !== columnId) {
          const position = board.cards.filter((item) => item.columnId === columnId && item.cardId !== card.cardId).length;
          await boardsApi.moveCard(board.board.boardId, card.cardId, { columnId, position });
        }
      } else {
        await boardsApi.createCard(board.board.boardId, { columnId, ...input });
      }
      await onSaved();
      onClose();
    } catch (err) {
      const apiFields = getApiErrorFields(err);
      const mapped: Record<string, string> = {};
      for (const [field, message] of Object.entries(apiFields)) {
        if (field === "title" || field === "columnId") {
          mapped[field] = message;
        } else {
          const templateField = selectedTemplate?.fields.find((item) => item.label === field);
          if (templateField !== undefined) mapped[`field-${templateField.fieldId}`] = message;
        }
      }
      if (Object.keys(mapped).length > 0) {
        setFieldErrors(mapped);
        setError("Corrija os campos destacados para salvar o card.");
      } else {
        setError(getApiErrorMessage(err));
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive(): Promise<void> {
    if (card === undefined || readOnly) return;
    const archived = await confirm({
      title: "Arquivar card",
      description: isDirty
        ? "Este card tem alterações não salvas. Arquivar mesmo assim? O card será removido do quadro."
        : "Arquivar este card? Ele será removido do quadro.",
      confirmLabel: "Arquivar card",
    });
    if (!archived) return;
    setIsSaving(true);
    try {
      await boardsApi.archiveCard(board.board.boardId, card.cardId);
      addToast({ type: "success", title: "Card arquivado" });
      await onSaved();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => { if (!next) void requestClose(); }}
      title={readOnly ? "Visualizar card" : card !== undefined ? "Editar card" : "Novo card"}
      description={board.board.name}
      className="max-h-[90vh] max-w-6xl overflow-hidden"
    >
      <div className="grid h-[calc(90vh-7rem)] min-h-0 gap-5 md:grid-cols-[minmax(0,1fr)_270px]">
        <div className="min-h-0 min-w-0 space-y-5 overflow-y-auto pr-1">
          <div>
            {card?.cardNumber !== undefined && (
              <p className="mb-1 text-[11px] font-medium text-muted-foreground">Card #{card.cardNumber}</p>
            )}
            <label className="label" htmlFor="card-title">Título</label>
            <input
              id="card-title"
              className={cn("input-base h-auto py-2.5 text-base font-semibold", fieldErrors.title !== undefined && "border-status-danger focus:border-status-danger")}
              placeholder="Ex.: Residencial Jardins"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                clearFieldError("title");
              }}
              aria-invalid={fieldErrors.title !== undefined}
              maxLength={160}
              autoFocus={!readOnly}
              disabled={readOnly}
            />
            {fieldErrors.title !== undefined && <p className="mt-1 text-xs text-status-danger">{fieldErrors.title}</p>}
          </div>
          <div>
            <label className="label" htmlFor="card-description">Descrição</label>
            <textarea
              id="card-description"
              className="input-base min-h-[120px] resize-y py-3"
              placeholder="Contexto, próximo passo, observações…"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              disabled={readOnly}
            />
          </div>

          {selectedTemplate !== undefined ? (
            <section className="overflow-hidden rounded-[8px] border border-border bg-muted/20">
              <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Campos do template</p>
                  <p className="truncate text-sm font-medium text-foreground">{selectedTemplate.name}</p>
                </div>
                <span className="shrink-0 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
                  {selectedTemplate.fields.length} campo{selectedTemplate.fields.length !== 1 ? "s" : ""}
                </span>
              </header>
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                {selectedTemplate.fields.map((field) => (
                  <div key={field.fieldId} className={field.type === "longText" || field.type === "file" || field.type === "files" ? "sm:col-span-2" : ""}>
                    <label className="label" htmlFor={`field-${field.fieldId}`}>
                      {field.label}{field.required ? " *" : ""}
                    </label>
                    {renderField(field, fieldValues[field.fieldId], fieldErrors[`field-${field.fieldId}`], board.board.boardId, (value) => updateField(field.fieldId, value), readOnly)}
                    {fieldErrors[`field-${field.fieldId}`] !== undefined && (
                      <p className="mt-1 text-xs text-status-danger">{fieldErrors[`field-${field.fieldId}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="rounded-[8px] border border-dashed border-border bg-muted/10 px-4 py-5 text-sm text-muted-foreground">
              Escolha um template ao lado para preencher campos extras do card.
            </div>
          )}

          <section className="overflow-hidden rounded-[8px] border border-border bg-card">
            <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Histórico</p>
                <p className="text-sm font-medium text-foreground">Alterações do card</p>
              </div>
              <span className="shrink-0 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
                {historyEntries.length} registro{historyEntries.length !== 1 ? "s" : ""}
              </span>
            </header>
            {historyEntries.length === 0 ? (
              <p className="px-4 py-5 text-xs text-muted-foreground">O histórico será registrado após salvar o card.</p>
            ) : (
              <ol className="p-4">
                {historyEntries.map((entry, index) => (
                  <li key={entry.historyId} className="relative flex gap-3 pb-4 last:pb-0">
                    {index < historyEntries.length - 1 && (
                      <span className="absolute bottom-0 left-[13px] top-7 w-px bg-border" aria-hidden="true" />
                    )}
                    <span className={cn(
                      "relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                      entry.action === "created" && "border-status-success-border bg-status-success-subtle text-status-success",
                      entry.action === "updated" && "border-navy-200 bg-navy-50 text-navy",
                      entry.action === "moved" && "border-status-warning-border bg-status-warning-subtle text-status-warning",
                      entry.action === "archived" && "border-status-danger-border bg-status-danger-subtle text-status-danger",
                    )}>
                      <HistoryIcon action={entry.action} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground">{historyLabel(entry.action)}</p>
                        <time className="text-[10px] text-muted-foreground">{formatDateTime(entry.createdAt)}</time>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-foreground">{entry.description}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{entry.userEmail ?? (entry.userId !== "" ? entry.userId : "Sistema")}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="min-h-0 space-y-5 md:border-l md:border-border md:pl-5">
          <div>
            <label className="label" htmlFor="card-column">Coluna</label>
            <Select
              id="card-column"
              value={columnId}
              onValueChange={(value) => {
                setColumnId(value);
                clearFieldError("columnId");
              }}
              options={board.columns.map((column) => ({ value: column.columnId, label: column.name }))}
              className={fieldErrors.columnId !== undefined ? "border-status-danger focus:border-status-danger" : undefined}
              disabled={readOnly}
            />
            {fieldErrors.columnId !== undefined && <p className="mt-1 text-xs text-status-danger">{fieldErrors.columnId}</p>}
          </div>
          <div>
            <label className="label" htmlFor="card-template">Template</label>
            <Select
              id="card-template"
              value={templateId}
              onValueChange={(next) => {
                setTemplateId(next);
                setFieldValues({});
                setFieldErrors({});
                setError(null);
              }}
              options={[{ value: "", label: "Sem template" }, ...board.templates.map((template) => ({ value: template.templateId, label: template.name }))]}
              disabled={readOnly}
            />
          </div>
          <div>
            <p className="label">Responsáveis</p>
            <AssigneePicker
              participants={boardParticipants(board)}
              selectedEmails={assigneeEmails}
              onChange={(emails) => setAssigneeEmails([...emails])}
              disabled={readOnly}
            />
          </div>
          <div>
            <p className="label">Labels</p>
            <LabelPicker
              boardId={board.board.boardId}
              labels={board.labels}
              selectedIds={labelIds}
              onChange={(ids) => setLabelIds([...ids])}
              onCreated={onSaved}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2 border-t border-border pt-3">
            {!readOnly && (
              <button type="button" className="btn btn-primary w-full rounded-[8px]" onClick={() => void handleSave()} disabled={isSaving}>
                {isSaving ? "Salvando…" : "Salvar"}
              </button>
            )}
            {!readOnly && error !== null && (
              <div role="alert" className="flex items-start gap-2 rounded-[8px] border border-status-danger-border bg-status-danger-subtle p-3 text-xs leading-relaxed text-status-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button type="button" className={cn("btn w-full rounded-[8px]", readOnly ? "btn-primary" : "btn-secondary")} onClick={() => void requestClose()} disabled={isSaving}>
              {readOnly ? "Fechar" : "Cancelar"}
            </button>
            {!readOnly && card !== undefined && (
              <button type="button" className="btn btn-outline btn-sm w-full text-status-danger" onClick={() => void handleArchive()} disabled={isSaving}>
                <Trash2 className="h-3.5 w-3.5" /> Arquivar
              </button>
            )}
          </div>
        </aside>
      </div>
    </Modal>
  );
}
