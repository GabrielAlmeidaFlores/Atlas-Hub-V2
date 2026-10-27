import type { Board } from '../types.js';
import type { BoardItemRecord, BoardRepository } from '../repository.js';

export class MemoryBoardRepository implements BoardRepository {
  readonly boards = new Map<string, Board>();
  readonly items = new Map<string, Map<string, BoardItemRecord>>();

  async listBoards(): Promise<readonly Board[]> {
    return [...this.boards.values()];
  }

  async getBoard(boardId: string): Promise<Board | null> {
    return this.boards.get(boardId) ?? null;
  }

  async putBoard(board: Board): Promise<void> {
    this.boards.set(board.boardId, board);
  }

  async updateBoard(boardId: string, patch: Partial<Board>): Promise<Board | null> {
    const current = this.boards.get(boardId);
    if (current === undefined) return null;
    const next = { ...current, ...patch };
    this.boards.set(boardId, next);
    return next;
  }

  async nextCardSequence(boardId: string): Promise<number> {
    const board = this.boards.get(boardId);
    if (board === undefined) return 0;
    const next = (board.cardSequence ?? 0) + 1;
    this.boards.set(boardId, { ...board, cardSequence: next });
    return next;
  }

  async listItems(boardId: string): Promise<readonly BoardItemRecord[]> {
    return [...(this.items.get(boardId)?.values() ?? [])];
  }

  async putItem(item: BoardItemRecord): Promise<void> {
    const board = this.items.get(item.boardId) ?? new Map<string, BoardItemRecord>();
    board.set(item.itemKey, item);
    this.items.set(item.boardId, board);
  }

  async updateItem(
    boardId: string,
    itemKey: string,
    patch: Readonly<Record<string, unknown>>,
  ): Promise<BoardItemRecord | null> {
    const board = this.items.get(boardId);
    const current = board?.get(itemKey);
    if (current === undefined) return null;
    const next = { ...current, ...patch } as BoardItemRecord;
    board?.set(itemKey, next);
    return next;
  }

  async deleteItem(boardId: string, itemKey: string): Promise<void> {
    this.items.get(boardId)?.delete(itemKey);
  }
}
