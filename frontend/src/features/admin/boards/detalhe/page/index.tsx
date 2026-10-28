import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, GripVertical, Plus, Settings2, Users } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { boardsApi } from "@/services/boards";
import { getApiErrorMessage } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import type { BoardAccessRole, BoardCard, BoardColumn, BoardFieldValue, BoardView } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonPage } from "@/components/ui/skeleton";
import { setBreadcrumbLeaf } from "@/components/shared/app-breadcrumb";
import { cn } from "@/lib/utils";
import { COLUMN_COLOR_CLASSES, LABEL_COLOR_CLASSES, LABEL_TEXT_CLASSES } from "../../labels";
import { boardParticipants, participantDisplayName, participantInitials } from "../../participants";
import { BoardSettings } from "../../components/board-settings";
import { BoardMembers } from "../../components/board-members";
import { CardModal } from "../../components/card-modal";

interface CardEditorState {
  readonly open: boolean;
  readonly card?: BoardCard;
  readonly columnId?: string;
}

interface ColumnSurfaceProps {
  readonly column: BoardColumn;
  readonly cards: readonly BoardCard[];
  readonly board: BoardView;
  readonly dragHandle?: ReactNode;
  readonly source?: boolean;
  readonly overlay?: boolean;
  readonly onCardOpen?: (card: BoardCard, columnId: string) => void;
  readonly onAddCard?: (columnId: string) => void;
  readonly movedCardId?: string | null;
  readonly dragOverColumnId?: string | null;
  readonly cardDraggable?: boolean;
  readonly cardDragging?: boolean;
}

function fieldText(value: BoardFieldValue | undefined): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.map((item) => (typeof item === "object" && item !== null && "name" in item ? String(item.name) : "")).filter(Boolean).join(", ");
  if (typeof value === "object" && "name" in value) return String(value.name);
  return String(value);
}

function CardItem({
  card,
  board,
  onOpen,
  justMoved,
  overlay = false,
}: {
  readonly card: BoardCard;
  readonly board: BoardView;
  readonly onOpen?: () => void;
  readonly justMoved: boolean;
  readonly overlay?: boolean;
}): ReactNode {
  const template = board.templates.find((item) => item.templateId === card.templateId);
  const values = template !== undefined
    ? template.fields.map((field) => ({ field, value: fieldText(card.fieldValues[field.fieldId]) })).filter((entry) => entry.value.length > 0).slice(0, 3)
    : [];
  const participants = boardParticipants(board);
  const assignees = participants.filter((participant) => (card.assigneeEmails ?? []).includes(participant.email));
  return (
    <button
      type="button"
      onClick={overlay ? undefined : onOpen}
      className={cn(
        "group w-full rounded-[8px] border border-border bg-card p-3 text-left shadow-sm transition-all duration-200",
        "hover:border-navy-200 hover:bg-muted/40",
        justMoved && "card-drop",
        overlay && "pointer-events-none",
      )}
    >
      {card.labelIds.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {card.labelIds.map((labelId) => {
            const label = board.labels.find((item) => item.labelId === labelId);
            return label === undefined ? null : (
              <span
                key={labelId}
                className={cn(
                  "inline-flex h-2.5 w-10 items-center overflow-hidden px-0 transition-all duration-300 ease-out group-hover:h-5 group-hover:w-auto group-hover:max-w-[180px] group-hover:px-1.5",
                  LABEL_COLOR_CLASSES[label.color],
                )}
              >
                <span className={cn("max-w-0 overflow-hidden whitespace-nowrap text-[10px] font-semibold opacity-0 transition-all duration-300 ease-out group-hover:max-w-[180px] group-hover:opacity-100", LABEL_TEXT_CLASSES[label.color])}>
                  {label.name}
                </span>
              </span>
            );
          })}
        </div>
      )}
      {card.cardNumber !== undefined && (
        <p className="mb-1 text-xs font-semibold text-muted-foreground">#{card.cardNumber}</p>
      )}
      <p className="min-w-0 text-sm font-semibold text-foreground">{card.title}</p>
      {card.description !== undefined && card.description.length > 0 && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{card.description}</p>
      )}
      {values.length > 0 && (
        <dl className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
          {values.map(({ field, value }) => (
            <div key={field.fieldId} className="flex gap-1">
              <dt className="shrink-0 font-medium">{field.label}:</dt>
              <dd className="truncate">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {assignees.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {assignees.slice(0, 3).map((participant) => (
            <span
              key={participant.email}
              title={participant.email}
              className="inline-flex h-5 max-w-[128px] items-center gap-1 rounded-full border border-border bg-navy-50 px-1 text-[9px] font-semibold text-navy"
            >
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[8px] font-bold">
                {participantInitials(participant.name)}
              </span>
              <span className="truncate">{participantDisplayName(participant.name)}</span>
            </span>
          ))}
          {assignees.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{assignees.length - 3}</span>
          )}
        </div>
      )}
    </button>
  );
}

function DraggableCard({
  card,
  board,
  onOpen,
  justMoved,
  canWrite,
}: {
  readonly card: BoardCard;
  readonly board: BoardView;
  readonly onOpen: () => void;
  readonly justMoved: boolean;
  readonly canWrite: boolean;
}): ReactNode {
  const dragged = useRef(false);
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.cardId,
    data: { type: "card", cardId: card.cardId },
    disabled: !canWrite,
  });

  useEffect(() => {
    if (isDragging) {
      dragged.current = true;
      return;
    }
    if (!dragged.current) return;
    const timer = window.setTimeout(() => { dragged.current = false; }, 0);
    return () => window.clearTimeout(timer);
  }, [isDragging]);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      style={{ transform: isDragging ? undefined : CSS.Transform.toString(transform), transition }}
      className={cn("w-full", isDragging && "opacity-30")}
      onClickCapture={(event) => {
        if (!dragged.current) return;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <CardItem card={card} board={board} onOpen={onOpen} justMoved={justMoved} />
    </div>
  );
}

function ColumnSurface({
  column,
  cards,
  board,
  dragHandle,
  source = false,
  overlay = false,
  onCardOpen,
  onAddCard,
  movedCardId = null,
  dragOverColumnId = null,
  cardDraggable = false,
  cardDragging = false,
}: ColumnSurfaceProps): ReactNode {
  return (
    <section
      className={cn(
        "relative flex w-[300px] shrink-0 flex-col overflow-hidden rounded-[8px] border transition-all duration-200",
        overlay ? "h-auto max-h-[70vh]" : "max-h-full min-h-0",
        COLUMN_COLOR_CLASSES[column.color ?? "slate"],
        source && "border-dashed border-navy/30 opacity-30",
        overlay && "border-dashed border-navy/30 shadow-[0_20px_50px_rgb(15_23_42/0.25)] ring-2 ring-navy/15",
        !overlay && cardDragging && dragOverColumnId === column.columnId ? "border-navy bg-navy-50/50 ring-2 ring-navy/20" : "",
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          {dragHandle ?? (overlay ? (
            <span className="p-1 text-muted-foreground" aria-hidden="true">
              <GripVertical className="h-4 w-4" />
            </span>
          ) : null)}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">{column.name}</h2>
            <p className="text-[10px] text-muted-foreground">{cards.length} card{cards.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {!overlay && onAddCard !== undefined && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onAddCard?.(column.columnId)}
            aria-label={`Novo card em ${column.name}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </header>
      <div className={cn("flex flex-col gap-2 p-2", overlay ? "min-h-[160px]" : "min-h-0 overflow-y-auto overscroll-contain")}>
        {overlay ? (
          cards.map((card) => (
            <CardItem key={card.cardId} card={card} board={board} overlay justMoved={false} />
          ))
        ) : (
          <SortableContext items={cards.map((card) => card.cardId)} strategy={verticalListSortingStrategy}>
            {cards.map((card) => (
              <DraggableCard
                key={card.cardId}
                card={card}
                board={board}
                onOpen={() => onCardOpen?.(card, column.columnId)}
                justMoved={movedCardId === card.cardId}
                canWrite={cardDraggable}
              />
            ))}
          </SortableContext>
        )}
        {cards.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            {onAddCard !== undefined ? "Arraste um card aqui ou crie um novo." : "Nenhum card."}
          </p>
        )}
      </div>
    </section>
  );
}

function SortableColumn(props: Omit<ColumnSurfaceProps, "dragHandle" | "source"> & { readonly justMoved?: boolean; readonly reorderable?: boolean }): ReactNode {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: props.column.columnId,
    disabled: props.reorderable === false,
  });
  const handle = props.reorderable === false ? undefined : (
    <button
      ref={setActivatorNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      className="cursor-grab touch-none rounded-[4px] p-1 text-muted-foreground hover:bg-card hover:text-foreground active:cursor-grabbing"
      aria-label={`Reordenar coluna ${props.column.name}`}
      title="Arrastar para reordenar"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("h-full min-h-0 shrink-0", isDragging && "z-10", props.justMoved === true && "column-drop")}
    >
      <ColumnSurface {...props} dragHandle={handle} source={isDragging} />
    </div>
  );
}

function cardsInColumn(board: BoardView, columnId: string): BoardCard[] {
  return board.cards
    .filter((card) => card.columnId === columnId)
    .sort((a, b) => a.position - b.position);
}

interface CardDropTarget {
  readonly columnId: string;
  readonly index: number;
}

function resolveCardTarget(board: BoardView, activeId: string, overId: string, afterOverCard = false): CardDropTarget | null {
  if (activeId === overId) return null;
  const overCard = board.cards.find((card) => card.cardId === overId);
  if (overCard !== undefined) {
    const list = cardsInColumn(board, overCard.columnId).filter((card) => card.cardId !== activeId);
    const index = list.findIndex((card) => card.cardId === overId);
    return { columnId: overCard.columnId, index: index < 0 ? list.length : index + (afterOverCard ? 1 : 0) };
  }
  if (board.columns.some((column) => column.columnId === overId)) {
    const list = cardsInColumn(board, overId).filter((card) => card.cardId !== activeId);
    return { columnId: overId, index: list.length };
  }
  return null;
}

function moveCardLocally(board: BoardView, activeId: string, target: CardDropTarget): BoardView {
  const active = board.cards.find((card) => card.cardId === activeId);
  if (active === undefined) return board;
  const targetCards = cardsInColumn(board, target.columnId).filter((card) => card.cardId !== activeId);
  const index = Math.max(0, Math.min(target.index, targetCards.length));
  const targetOrdered = [...targetCards.slice(0, index), active, ...targetCards.slice(index)];
  const targetPositions = new Map(targetOrdered.map((card, position) => [card.cardId, position]));
  const sourceOrdered = active.columnId === target.columnId
    ? []
    : cardsInColumn(board, active.columnId).filter((card) => card.cardId !== activeId);
  return {
    ...board,
    cards: board.cards.map((card) => {
      if (card.cardId === activeId) return { ...card, columnId: target.columnId, position: index };
      if (card.columnId === target.columnId) {
        const position = targetPositions.get(card.cardId);
        return position === undefined ? card : { ...card, position };
      }
      if (card.columnId === active.columnId) {
        const position = sourceOrdered.findIndex((item) => item.cardId === card.cardId);
        return position < 0 ? card : { ...card, position };
      }
      return card;
    }),
  };
}

function accessRoleOf(board: BoardView): BoardAccessRole {
  return board.accessRole ?? "read";
}

export default function AdminBoardsDetalhePage(): ReactNode {
  const { boardId } = useParams<{ boardId: string }>();
  const addToast = useToastStore((s) => s.addToast);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [board, setBoard] = useState<BoardView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [editor, setEditor] = useState<CardEditorState>({ open: false });
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const dragStartBoard = useRef<BoardView | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [movedCardId, setMovedCardId] = useState<string | null>(null);
  const [movedColumnId, setMovedColumnId] = useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  async function load(): Promise<void> {
    if (boardId === undefined) return;
    const view = await boardsApi.get(boardId);
    setBoard(view);
    setBreadcrumbLeaf(view.board.name);
  }

  useEffect(() => {
    if (boardId === undefined) {
      setError("Quadro inválido");
      setIsLoading(false);
      return;
    }
    void load()
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
    return () => setBreadcrumbLeaf(undefined);
  }, [boardId]);

  function handleDragStart(event: DragStartEvent): void {
    const data = event.active.data.current as { readonly type?: string } | undefined;
    dragStartBoard.current = board;
    if (data?.type === "card") {
      setActiveCardId(String(event.active.id));
      setActiveColumnId(null);
      setDragOverColumnId(null);
      return;
    }
    setActiveColumnId(String(event.active.id));
    setActiveCardId(null);
    setDragOverColumnId(null);
  }

  function handleDragOver(event: DragOverEvent): void {
    if (board === null) return;
    const data = event.active.data.current as { readonly type?: string } | undefined;
    if (data?.type !== "card") return;
    const activeId = String(event.active.id);
    const overId = event.over === null ? null : String(event.over.id);
    if (overId === null) {
      setDragOverColumnId(null);
      return;
    }
    const activeRect = event.active.rect.current.translated;
    const afterOverCard = activeRect !== null && event.over !== null
      && activeRect.top + activeRect.height / 2 > event.over.rect.top + event.over.rect.height / 2;
    const target = resolveCardTarget(board, activeId, overId, afterOverCard);
    if (target === null) return;
    setDragOverColumnId(target.columnId);
    const active = board.cards.find((card) => card.cardId === activeId);
    if (active === undefined || active.columnId === target.columnId) {
      return;
    }
    setBoard(moveCardLocally(board, activeId, target));
  }

  async function handleCardDragEnd(event: DragEndEvent): Promise<void> {
    if (board === null) return;
    const activeId = String(event.active.id);
    const overId = event.over === null ? null : String(event.over.id);
    if (overId === null) {
      setBoard(dragStartBoard.current ?? board);
      return;
    }
    const activeCard = board.cards.find((item) => item.cardId === activeId);
    const overCard = board.cards.find((item) => item.cardId === overId);
    const activeRect = event.active.rect.current.translated;
    const sameColumn = activeCard !== undefined && overCard !== undefined && activeCard.columnId === overCard.columnId;
    const afterOverCard = sameColumn
      ? activeCard.position < overCard.position
      : activeRect !== null && event.over !== null
        && activeRect.top + activeRect.height / 2 > event.over.rect.top + event.over.rect.height / 2;
    const target = activeId === overId ? null : resolveCardTarget(board, activeId, overId, afterOverCard);
    const nextBoard = target === null ? board : moveCardLocally(board, activeId, target);
    if (target !== null) setBoard(nextBoard);
    const card = nextBoard.cards.find((item) => item.cardId === activeId);
    if (card === undefined) return;
    setMovedCardId(card.cardId);
    window.setTimeout(() => setMovedCardId((current) => current === card.cardId ? null : current), 600);
    try {
      await boardsApi.moveCard(board.board.boardId, card.cardId, { columnId: card.columnId, position: card.position });
    } catch (err) {
      await load();
      addToast({ type: "error", title: "Não foi possível mover o card", description: getApiErrorMessage(err) });
    }
  }

  function handleDragEnd(event: DragEndEvent): void {
    const data = event.active.data.current as { readonly type?: string } | undefined;
    setActiveCardId(null);
    setDragOverColumnId(null);
    if (data?.type === "card") {
      void handleCardDragEnd(event).finally(() => { dragStartBoard.current = null; });
      return;
    }
    dragStartBoard.current = null;
    void handleColumnDragEnd(event);
  }

  async function handleColumnDragEnd(event: DragEndEvent): Promise<void> {
    const activeId = String(event.active.id);
    const overId = event.over === null ? null : String(event.over.id);
    setActiveColumnId(null);
    if (board === null || overId === null || activeId === overId) return;
    const overColumnId = board.columns.some((column) => column.columnId === overId)
      ? overId
      : board.cards.find((card) => card.cardId === overId)?.columnId ?? null;
    if (overColumnId === null) return;
    const oldIndex = board.columns.findIndex((column) => column.columnId === activeId);
    const newIndex = board.columns.findIndex((column) => column.columnId === overColumnId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    const nextColumns = arrayMove([...board.columns], oldIndex, newIndex)
      .map((column, position) => ({ ...column, position }));
    setBoard({ ...board, columns: nextColumns });
    setMovedColumnId(activeId);
    window.setTimeout(() => setMovedColumnId((current) => current === activeId ? null : current), 500);

    try {
      await boardsApi.updateColumn(board.board.boardId, activeId, { position: newIndex });
    } catch (err) {
      await load();
      addToast({ type: "error", title: "Não foi possível reordenar as colunas", description: getApiErrorMessage(err) });
    }
  }

  if (isLoading) return <SkeletonPage />;
  if (board === null) {
    return (
      <div className="animate-in">
        <PageHeader title="Quadro" action={<Link to="/admin/boards" className="btn btn-outline btn-sm"><ArrowLeft className="h-4 w-4" /> Voltar</Link>} />
        <div className="page-content">
          <p className="text-sm text-status-danger">{error ?? "Quadro não encontrado"}</p>
        </div>
      </div>
    );
  }

  const activeColumn = board.columns.find((column) => column.columnId === activeColumnId);
  const activeCard = board.cards.find((card) => card.cardId === activeCardId);
  const accessRole = accessRoleOf(board);
  const canWrite = accessRole === "owner" || accessRole === "admin" || accessRole === "write";
  const canManage = accessRole === "owner" || accessRole === "admin";

  return (
    <div className="animate-in flex h-full min-h-0 flex-col">
      <div className="shrink-0">
        <PageHeader
        title={board.board.name}
        description={board.board.description}
        action={(
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/boards" className="btn btn-outline btn-sm"><ArrowLeft className="h-4 w-4" /> Quadros</Link>
            <Link to={`/admin/boards/${board.board.boardId}/metrics`} className="btn btn-outline btn-sm"><BarChart3 className="h-4 w-4" /> Métricas</Link>
            {canManage && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setMembersOpen(true)}>
                <Users className="h-4 w-4" /> Participantes
              </button>
            )}
            {canManage && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSettingsOpen(true)}>
                <Settings2 className="h-4 w-4" /> Configurar
              </button>
            )}
            {canWrite && (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditor({ open: true, columnId: board.columns[0]?.columnId })}>
                <Plus className="h-4 w-4" /> Novo card
              </button>
            )}
          </div>
        )}
        />
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col py-4">
        {error !== null && <p className="mb-3 px-4 text-sm text-status-danger lg:px-6">{error}</p>}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragCancel={() => {
            if (dragStartBoard.current !== null) setBoard(dragStartBoard.current);
            dragStartBoard.current = null;
            setActiveColumnId(null);
            setActiveCardId(null);
            setDragOverColumnId(null);
          }}
          onDragEnd={handleDragEnd}
        >
          <div className="min-h-0 w-full flex-1 overflow-x-auto overflow-y-hidden pb-3">
            <SortableContext items={board.columns.map((column) => column.columnId)} strategy={horizontalListSortingStrategy}>
              <div className="flex h-full min-h-0 w-max min-w-full items-start gap-4 px-4 lg:px-6">
                {board.columns.map((column) => {
                  const cards = board.cards
                    .filter((card) => card.columnId === column.columnId)
                    .sort((a, b) => a.position - b.position);
                  return (
                    <SortableColumn
                      key={column.columnId}
                      column={column}
                      cards={cards}
                      board={board}
                      onCardOpen={(card, columnId) => setEditor({ open: true, card, columnId })}
                      {...(canWrite ? { onAddCard: (columnId: string) => setEditor({ open: true, columnId }) } : {})}
                      movedCardId={movedCardId}
                      dragOverColumnId={dragOverColumnId}
                      justMoved={movedColumnId === column.columnId}
                      cardDraggable={canWrite}
                      cardDragging={activeCardId !== null}
                      reorderable={canManage}
                    />
                  );
                })}
                {board.columns.length === 0 && (
                  <div className="card p-6 text-sm text-muted-foreground">
                    Nenhuma coluna. Abra <strong>Configurar</strong> para criar a primeira.
                  </div>
                )}
              </div>
            </SortableContext>
          </div>
          {createPortal(
            <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
              {activeCard !== undefined ? (
                <div className="w-[282px] rotate-[1deg]">
                  <CardItem card={activeCard} board={board} overlay justMoved={false} />
                </div>
              ) : activeColumn !== undefined ? (
                <div className="w-[300px]">
                  <ColumnSurface
                    column={activeColumn}
                    cards={board.cards
                      .filter((card) => card.columnId === activeColumn.columnId)
                      .sort((a, b) => a.position - b.position)}
                    board={board}
                    overlay
                  />
                </div>
              ) : null}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>
      </div>

      {canManage && (
        <BoardSettings open={settingsOpen} board={board} onClose={() => setSettingsOpen(false)} onSaved={load} />
      )}
      {canManage && (
        <BoardMembers open={membersOpen} board={board} onClose={() => setMembersOpen(false)} onSaved={load} />
      )}
      <CardModal
        open={editor.open}
        board={board}
        {...(editor.card !== undefined ? { card: editor.card } : {})}
        {...(editor.columnId !== undefined ? { initialColumnId: editor.columnId } : {})}
        onClose={() => setEditor({ open: false })}
        onSaved={load}
        readOnly={!canWrite}
      />
    </div>
  );
}
