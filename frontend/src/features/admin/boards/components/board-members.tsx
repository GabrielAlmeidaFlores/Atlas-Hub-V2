import { useEffect, useState, type ReactNode } from "react";
import { UserPlus, Users } from "lucide-react";
import { boardsApi, type BoardMemberCandidate } from "@/services/boards";
import { getApiErrorMessage } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import type { BoardMemberRole, BoardView } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useDiscardGuard } from "@/components/ui/confirm-dialog/use-discard-guard";

interface BoardMembersProps {
  readonly open: boolean;
  readonly board: BoardView;
  readonly onClose: () => void;
  readonly onSaved: () => Promise<void>;
}

const ROLE_LABELS: Readonly<Record<BoardMemberRole, string>> = {
  admin: "Admin",
  write: "Escrita",
  read: "Leitura",
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin — gerencia o quadro e participantes" },
  { value: "write", label: "Escrita — cria e edita cards" },
  { value: "read", label: "Leitura — apenas visualiza" },
] as const;

export function BoardMembers({ open, board, onClose, onSaved }: BoardMembersProps): ReactNode {
  const addToast = useToastStore((s) => s.addToast);
  const confirm = useConfirm();
  const [candidates, setCandidates] = useState<readonly BoardMemberCandidate[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BoardMemberRole>("read");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formDirty = email.length > 0 || role !== "read";
  const closeMembers = (): void => {
    setEmail("");
    setRole("read");
    setError(null);
    onClose();
  };
  const requestClose = useDiscardGuard(formDirty, closeMembers);

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    setError(null);
    void boardsApi.listMemberCandidates(board.board.boardId)
      .then(setCandidates)
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [open, board.board.boardId]);

  const members = board.board.members ?? [];
  const ownerEmail = board.board.createdByEmail ?? "";
  const available = candidates.filter((candidate) => (
    candidate.email !== ownerEmail
    && !members.some((member) => member.email === candidate.email)
  ));

  async function handleAdd(): Promise<void> {
    if (email.length === 0) {
      setError("Selecione um usuário");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await boardsApi.addMember(board.board.boardId, { email, role });
      addToast({ type: "success", title: "Participante adicionado" });
      setEmail("");
      setRole("read");
      await onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove(memberEmail: string): Promise<void> {
    const confirmed = await confirm({
      title: "Remover participante",
      description: `Remover ${memberEmail} do quadro? A pessoa perderá o acesso.`,
      confirmLabel: "Remover",
    });
    if (!confirmed) return;
    setIsSaving(true);
    setError(null);
    try {
      await boardsApi.removeMember(board.board.boardId, memberEmail);
      addToast({ type: "success", title: "Participante removido" });
      await onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={(next) => { if (!next) void requestClose(); }} title="Participantes do quadro" description={board.board.name} className="max-w-4xl">
      <div className="space-y-5">
        <div className="rounded-[8px] border border-border bg-muted/20 p-4">
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground"><Users className="h-4 w-4" /> Quem tem acesso</p>
          <p className="mb-3 text-xs text-muted-foreground">O criador e as pessoas adicionadas abaixo podem abrir este quadro.</p>
          <ul className="space-y-2">
            <li className="flex items-center justify-between gap-3 rounded-[6px] border border-border bg-card px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{ownerEmail.length > 0 ? ownerEmail : "Criador do quadro"}</p>
                <p className="text-[11px] text-muted-foreground">Criador</p>
              </div>
              <span className="shrink-0 rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-semibold text-navy">Admin</span>
            </li>
            {members.map((member) => (
              <li key={member.email} className="flex items-center justify-between gap-3 rounded-[6px] border border-border bg-card px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{member.name !== "" ? member.name : member.email}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{member.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">{ROLE_LABELS[member.role]}</span>
                  <button type="button" className="btn btn-ghost btn-sm text-status-danger" onClick={() => void handleRemove(member.email)} disabled={isSaving}>
                    Remover
                  </button>
                </div>
              </li>
            ))}
            {members.length === 0 && (
              <li className="px-1 text-xs text-muted-foreground">Nenhum participante adicionado além do criador.</li>
            )}
          </ul>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><UserPlus className="h-4 w-4" /> Adicionar participante</p>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="form-group">
              <label className="form-label">Usuário</label>
              <Select
                value={email}
                onValueChange={(value) => { setEmail(value); setError(null); }}
                options={[
                  { value: "", label: isLoading ? "Carregando usuários…" : "Selecione um usuário" },
                  ...available.map((candidate) => ({ value: candidate.email, label: `${candidate.nome} — ${candidate.email}` })),
                ]}
                disabled={isLoading || isSaving}
                ariaLabel="Usuário"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Permissão</label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as BoardMemberRole)}
                options={ROLE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                disabled={isSaving}
                ariaLabel="Permissão"
              />
            </div>
          </div>
          {available.length === 0 && !isLoading && (
            <p className="text-xs text-muted-foreground">Todos os usuários disponíveis já participam do quadro.</p>
          )}
          {error !== null && <p className="text-xs text-status-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary rounded-[8px]" onClick={() => void requestClose()} disabled={isSaving}>Fechar</button>
            <button type="button" className="btn btn-primary rounded-[8px]" onClick={() => void handleAdd()} disabled={isSaving || email.length === 0}>
              {isSaving ? "Adicionando…" : "Adicionar"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
