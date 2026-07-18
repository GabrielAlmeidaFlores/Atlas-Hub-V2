import { useState, type ReactNode, type ChangeEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { MembroEquipe } from "@/types";

interface Props {
  readonly value: MembroEquipe[];
  readonly onChange: (next: MembroEquipe[]) => void;
}

const emptyMember = (): MembroEquipe => ({ nome: "", cargo: "", bio: "" });

export function EquipeEditor({ value, onChange }: Props): ReactNode {
  const [draft, setDraft] = useState<MembroEquipe>(emptyMember());

  function setDraftField(field: keyof MembroEquipe) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((p) => ({ ...p, [field]: e.target.value }));
  }

  function addMember(): void {
    if (draft.nome.trim().length < 2 || draft.cargo.trim().length < 2 || draft.bio.trim().length < 10) return;
    onChange([...value, {
      nome: draft.nome.trim(),
      cargo: draft.cargo.trim(),
      bio: draft.bio.trim(),
      ...(draft.linkedin !== undefined && draft.linkedin !== "" ? { linkedin: draft.linkedin.trim() } : {}),
    }]);
    setDraft(emptyMember());
  }

  function removeAt(index: number): void {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((m, i) => (
            <li key={`${m.nome}-${String(i)}`} className="flex items-start justify-between border border-border px-4 py-3">
              <div className="min-w-0 pr-3">
                <p className="text-sm font-medium text-foreground">{m.nome}</p>
                <p className="text-xs text-muted-foreground">{m.cargo}</p>
                <p className="mt-1 text-xs text-foreground">{m.bio}</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm shrink-0" onClick={() => removeAt(i)} aria-label="Remover">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 border border-dashed border-input p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Novo membro</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input className="input-base" value={draft.nome} onChange={setDraftField("nome")} />
          </div>
          <div className="form-group">
            <label className="form-label">Cargo</label>
            <input className="input-base" value={draft.cargo} onChange={setDraftField("cargo")} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Bio (mín. 10 caracteres)</label>
          <textarea className="input-base resize-none" rows={2} value={draft.bio} onChange={setDraftField("bio")} />
        </div>
        <div className="form-group">
          <label className="form-label">LinkedIn (opcional)</label>
          <input className="input-base" value={draft.linkedin ?? ""} onChange={setDraftField("linkedin")} placeholder="https://" />
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={addMember}
          disabled={draft.nome.trim().length < 2 || draft.cargo.trim().length < 2 || draft.bio.trim().length < 10}
        >
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>
    </div>
  );
}
