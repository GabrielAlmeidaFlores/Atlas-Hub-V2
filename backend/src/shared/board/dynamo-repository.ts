import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { db } from '../db/index.js';
import { Tables } from '../core/tables.js';
import type { Board } from './types.js';
import type {
  BoardItemRecord,
  BoardRepository,
} from './repository.js';

function updateExpression(patch: Readonly<Record<string, unknown>>): {
  readonly expression: string;
  readonly names: Record<string, string>;
  readonly values: Record<string, unknown>;
} | null {
  const entries = Object.entries(patch).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return null;
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const sets = entries.map(([key, value], index) => {
    names[`#f${String(index)}`] = key;
    values[`:v${String(index)}`] = value;
    return `#f${String(index)} = :v${String(index)}`;
  });
  return {
    expression: `SET ${sets.join(', ')}`,
    names,
    values,
  };
}

export class DynamoBoardRepository implements BoardRepository {
  async listBoards(): Promise<readonly Board[]> {
    const boards: Board[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const result = await db.send(new ScanCommand({
        TableName: Tables.BOARDS,
        FilterExpression: 'attribute_not_exists(archivedAt)',
        ExclusiveStartKey: startKey,
      }));
      boards.push(...((result.Items as Board[] | undefined) ?? []));
      startKey = result.LastEvaluatedKey;
    } while (startKey !== undefined);
    return boards;
  }

  async getBoard(boardId: string): Promise<Board | null> {
    const result = await db.send(new GetCommand({
      TableName: Tables.BOARDS,
      Key: { boardId },
    }));
    return (result.Item as Board | undefined) ?? null;
  }

  async putBoard(board: Board): Promise<void> {
    await db.send(new PutCommand({ TableName: Tables.BOARDS, Item: board }));
  }

  async updateBoard(boardId: string, patch: Partial<Board>): Promise<Board | null> {
    const update = updateExpression(patch as Record<string, unknown>);
    if (update === null) return this.getBoard(boardId);
    const result = await db.send(new UpdateCommand({
      TableName: Tables.BOARDS,
      Key: { boardId },
      UpdateExpression: update.expression,
      ExpressionAttributeNames: update.names,
      ExpressionAttributeValues: update.values,
      ConditionExpression: 'attribute_exists(boardId)',
      ReturnValues: 'ALL_NEW',
    }));
    return (result.Attributes as Board | undefined) ?? null;
  }

  async nextCardSequence(boardId: string): Promise<number> {
    const result = await db.send(new UpdateCommand({
      TableName: Tables.BOARDS,
      Key: { boardId },
      UpdateExpression: 'ADD cardSequence :one',
      ExpressionAttributeValues: { ':one': 1 },
      ConditionExpression: 'attribute_exists(boardId)',
      ReturnValues: 'UPDATED_NEW',
    }));
    const value = result.Attributes?.['cardSequence'];
    if (typeof value !== 'number') throw new Error('Não foi possível gerar o número do card');
    return value;
  }

  async listItems(boardId: string): Promise<readonly BoardItemRecord[]> {
    const items: BoardItemRecord[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const result = await db.send(new QueryCommand({
        TableName: Tables.BOARD_ITEMS,
        KeyConditionExpression: 'boardId = :boardId',
        ExpressionAttributeValues: { ':boardId': boardId },
        ExclusiveStartKey: startKey,
      }));
      items.push(...((result.Items as BoardItemRecord[] | undefined) ?? []));
      startKey = result.LastEvaluatedKey;
    } while (startKey !== undefined);
    return items;
  }

  async putItem(item: BoardItemRecord): Promise<void> {
    await db.send(new PutCommand({ TableName: Tables.BOARD_ITEMS, Item: item }));
  }

  async updateItem(
    boardId: string,
    itemKey: string,
    patch: Readonly<Record<string, unknown>>,
  ): Promise<BoardItemRecord | null> {
    const update = updateExpression(patch);
    if (update === null) return null;
    const result = await db.send(new UpdateCommand({
      TableName: Tables.BOARD_ITEMS,
      Key: { boardId, itemKey },
      UpdateExpression: update.expression,
      ExpressionAttributeNames: update.names,
      ExpressionAttributeValues: update.values,
      ConditionExpression: 'attribute_exists(itemKey)',
      ReturnValues: 'ALL_NEW',
    }));
    return (result.Attributes as BoardItemRecord | undefined) ?? null;
  }

  async deleteItem(boardId: string, itemKey: string): Promise<void> {
    await db.send(new DeleteCommand({
      TableName: Tables.BOARD_ITEMS,
      Key: { boardId, itemKey },
    }));
  }
}
