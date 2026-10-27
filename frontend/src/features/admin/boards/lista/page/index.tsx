import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutGrid, Plus, ArrowRight } from "lucide-react";
import { boardsApi } from "@/services/boards";
import { getApiErrorMessage } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import { useAuthStore } from "@/stores/auth";
import type { Board, BoardIcon } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonPage } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { useDiscardGuard } from "@/components/ui/confirm-dialog/use-discard-guard";
import { formatDate } from "@/lib/utils";
import { BOARD_ICON_OPTIONS, BoardIconGlyph } from "../../icon";

export default function AdminBoardsListaPage(): ReactNode {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);
  const [boards, setBoards] = useState<readonly Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", icon: "layout-grid" as BoardIcon });
  const formDirty = form.name.length > 0 || form.description.length > 0 || form.icon !== "layout-grid";
  const closeCreate = (): void => {
    setShowCreate(false);
    setForm({ name: "", description: "", icon: "layout-grid" });
  };
  const requestClose = useDiscardGuard(formDirty, closeCreate);

  async function load(): Promise<void> {
    const items = await boardsApi.list();
    setBoards(items);
  }

  useEffect(() => {
    void load()
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleCreate(event: FormEvent): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    try {
      const view = await boardsApi.create({
        name: form.name,
        icon: form.icon,
        ...(form.description.trim().length > 0 ? { description: form.description } : {}),
      });
      setShowCreate(false);
      setForm({ name: "", description: "", icon: "layout-grid" });
      addToast({ type: "success", title: "Quadro criado" });
      navigate(`/admin/boards/${view.board.boardId}`);
    } catch (error) {
      addToast({ type: "error", title: "Não foi possível criar o quadro", description: getApiErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <SkeletonPage />;

  return (
    <div className="animate-in">
      <PageHeader
        title="Quadros"
        description="Organize leads e processos em quadros livres."
        {...(user === null || user.perfil === "ADMIN_MASTER" ? {
          action: (
            <button type="button" className="btn btn-primary btn-sm rounded-[8px]" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Novo quadro
            </button>
          ),
        } : {})}
      />

      <div className="page-content">
        {error !== null ? (
          <p className="text-sm text-status-danger">{error}</p>
        ) : boards.length === 0 ? (
          <EmptyState icon={LayoutGrid} title="Nenhum quadro ainda" description="Crie seu primeiro quadro para começar." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {boards.map((board) => (
              <Link key={board.boardId} to={`/admin/boards/${board.boardId}`} className="card card-hover block p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-navy-100 text-navy">
                    <BoardIconGlyph icon={board.icon} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <h2 className="mt-4 font-semibold text-foreground">{board.name}</h2>
                {board.description !== undefined && board.description.length > 0 && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{board.description}</p>
                )}
                <p className="mt-4 text-xs text-muted-foreground">Atualizado em {formatDate(board.updatedAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onOpenChange={(next) => { if (!next) void requestClose(); }} title="Novo quadro" description="Cada quadro tem colunas, labels e templates próprios.">
        <form onSubmit={(event) => void handleCreate(event)} className="space-y-4">
          <div>
            <label className="label" htmlFor="board-name">Nome</label>
            <input
              id="board-name"
              className="input-base"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              maxLength={80}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label" htmlFor="board-description">Descrição</label>
            <textarea
              id="board-description"
              className="input-base min-h-[90px]"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              maxLength={300}
            />
          </div>
          <div>
            <p className="label">Ícone</p>
            <div className="grid grid-cols-6 gap-2">
              {BOARD_ICON_OPTIONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`Ícone ${label}`}
                  aria-pressed={form.icon === value}
                  title={label}
                  onClick={() => setForm((prev) => ({ ...prev, icon: value }))}
                  className={`flex h-10 items-center justify-center border transition-colors ${
                    form.icon === value
                      ? "border-navy bg-navy-50 text-navy"
                      : "border-border bg-card text-muted-foreground hover:border-navy-200 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary rounded-[8px]" onClick={() => void requestClose()}>Cancelar</button>
            <button type="submit" className="btn btn-primary rounded-[8px]" disabled={isSaving}>{isSaving ? "Criando…" : "Criar quadro"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
