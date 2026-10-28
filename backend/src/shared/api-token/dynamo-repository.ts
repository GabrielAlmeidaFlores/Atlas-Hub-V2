import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db } from '../db/index.js';
import { Tables } from '../core/tables.js';
import type { ApiTokenRepository } from './repository.js';
import type { ApiTokenRecord } from './types.js';

const OWNER_INDEX = 'ownerId-createdAt-index';

export class DynamoApiTokenRepository implements ApiTokenRepository {
  async put(record: ApiTokenRecord): Promise<void> {
    await db.send(new PutCommand({ TableName: Tables.API_TOKENS, Item: record }));
  }

  async getByHash(tokenHash: string): Promise<ApiTokenRecord | null> {
    const result = await db.send(new GetCommand({
      TableName: Tables.API_TOKENS,
      Key: { tokenHash },
    }));
    return (result.Item as ApiTokenRecord | undefined) ?? null;
  }

  async listByOwner(ownerId: string): Promise<readonly ApiTokenRecord[]> {
    const items: ApiTokenRecord[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const result = await db.send(new QueryCommand({
        TableName: Tables.API_TOKENS,
        IndexName: OWNER_INDEX,
        KeyConditionExpression: 'ownerId = :ownerId',
        ExpressionAttributeValues: { ':ownerId': ownerId },
        ScanIndexForward: false,
        ExclusiveStartKey: startKey,
      }));
      items.push(...((result.Items as ApiTokenRecord[] | undefined) ?? []));
      startKey = result.LastEvaluatedKey;
    } while (startKey !== undefined);
    return items;
  }

  async markUsed(tokenHash: string, usedAt: string): Promise<void> {
    await db.send(new UpdateCommand({
      TableName: Tables.API_TOKENS,
      Key: { tokenHash },
      UpdateExpression: 'SET lastUsedAt = :usedAt',
      ExpressionAttributeValues: { ':usedAt': usedAt },
      ConditionExpression: 'attribute_exists(tokenHash) AND attribute_not_exists(revokedAt)',
    }));
  }

  async revoke(tokenHash: string, revokedAt: string): Promise<void> {
    await db.send(new UpdateCommand({
      TableName: Tables.API_TOKENS,
      Key: { tokenHash },
      UpdateExpression: 'SET revokedAt = :revokedAt',
      ExpressionAttributeValues: { ':revokedAt': revokedAt },
      ConditionExpression: 'attribute_exists(tokenHash) AND attribute_not_exists(revokedAt)',
    }));
  }
}
