import type {
  Board,
  BoardCard,
  BoardColumn,
  BoardLabel,
  BoardTemplate,
} from './types.js';

export type BoardColumnRecord = BoardColumn & { readonly itemKey: string };
export type BoardLabelRecord = BoardLabel & { readonly itemKey: string };
export type BoardTemplateRecord = BoardTemplate & { readonly itemKey: string };
export type BoardCardRecord = BoardCard & { readonly itemKey: string };

export type BoardItemRecord =
  | BoardColumnRecord
  | BoardLabelRecord
  | BoardTemplateRecord
  | BoardCardRecord;

export interface BoardRepository {
  listBoards(): Promise<readonly Board[]>;
  getBoard(boardId: string): Promise<Board | null>;
  putBoard(board: Board): Promise<void>;
  updateBoard(boardId: string, patch: Partial<Board>): Promise<Board | null>;
  nextCardSequence(boardId: string): Promise<number>;
  listItems(boardId: string): Promise<readonly BoardItemRecord[]>;
  putItem(item: BoardItemRecord): Promise<void>;
  updateItem(
    boardId: string,
    itemKey: string,
    patch: Readonly<Record<string, unknown>>,
  ): Promise<BoardItemRecord | null>;
  deleteItem(boardId: string, itemKey: string): Promise<void>;
}
