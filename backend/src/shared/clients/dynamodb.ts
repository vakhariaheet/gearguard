/**
 * DynamoDB Client Wrapper
 * 
 * Type-safe wrapper around AWS DynamoDB Document Client
 * with common operations and error handling.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  BatchGetCommand,
  BatchWriteCommand,
  TransactWriteCommand,
  type GetCommandInput,
  type PutCommandInput,
  type UpdateCommandInput,
  type DeleteCommandInput,
  type QueryCommandInput,
  type ScanCommandInput,
  type BatchGetCommandInput,
  type BatchWriteCommandInput,
  type TransactWriteCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { createLogger } from '../logger';

const logger = createLogger('DynamoDBClient');

// =============================================================================
// CLIENT INITIALIZATION
// =============================================================================

const dynamoClient = new DynamoDBClient({
  region: process.env['AWS_REGION'] || process.env['REGION'] || 'ap-south-1',
});

export const documentClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// =============================================================================
// TYPES
// =============================================================================

export interface DynamoDBKey {
  PK: string;
  SK: string;
}

export interface QueryOptions {
  indexName?: string;
  limit?: number;
  startKey?: Record<string, unknown>;
  scanIndexForward?: boolean;
  filterExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, unknown>;
  count: number;
}

// =============================================================================
// DYNAMODB CLIENT CLASS
// =============================================================================

export class DynamoDB {
  private tableName: string;

  constructor(tableName?: string) {
    this.tableName = tableName || process.env['DYNAMODB_TABLE'] || '';
    if (!this.tableName) {
      logger.warn('DynamoDB table name not configured');
    }
  }

  /**
   * Get a single item by key
   */
  async get<T>(key: DynamoDBKey): Promise<T | null> {
    const params: GetCommandInput = {
      TableName: this.tableName,
      Key: key,
    };

    try {
      const result = await documentClient.send(new GetCommand(params));
      return (result.Item as T) || null;
    } catch (error) {
      logger.error('DynamoDB get failed', error, { key });
      throw error;
    }
  }

  /**
   * Put (create or replace) an item
   */
  async put<T extends Record<string, unknown>>(item: T): Promise<T> {
    const params: PutCommandInput = {
      TableName: this.tableName,
      Item: {
        ...item,
        createdAt: item['createdAt'] || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    try {
      await documentClient.send(new PutCommand(params));
      return params.Item as T;
    } catch (error) {
      logger.error('DynamoDB put failed', error, { item });
      throw error;
    }
  }

  /**
   * Update an existing item with partial data
   */
  async update<T>(
    key: DynamoDBKey,
    updates: Partial<T>,
    options?: {
      conditionExpression?: string;
      expressionAttributeNames?: Record<string, string>;
      expressionAttributeValues?: Record<string, unknown>;
    }
  ): Promise<T> {
    // Build update expression dynamically
    const updateFields = Object.keys(updates).filter(
      (k) => k !== 'PK' && k !== 'SK' && updates[k as keyof T] !== undefined
    );

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    const expressionAttributeNames: Record<string, string> = {
      ...options?.expressionAttributeNames,
    };
    const expressionAttributeValues: Record<string, unknown> = {
      ':updatedAt': new Date().toISOString(),
      ...options?.expressionAttributeValues,
    };

    const updateExpressions = updateFields.map((field, index) => {
      const nameKey = `#field${index}`;
      const valueKey = `:value${index}`;
      expressionAttributeNames[nameKey] = field;
      expressionAttributeValues[valueKey] = updates[field as keyof T];
      return `${nameKey} = ${valueKey}`;
    });

    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: key,
      UpdateExpression: `SET ${updateExpressions.join(', ')}, #updatedAt = :updatedAt`,
      ExpressionAttributeNames: {
        ...expressionAttributeNames,
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: options?.conditionExpression,
      ReturnValues: 'ALL_NEW',
    };

    try {
      const result = await documentClient.send(new UpdateCommand(params));
      return result.Attributes as T;
    } catch (error) {
      logger.error('DynamoDB update failed', error, { key, updates });
      throw error;
    }
  }

  /**
   * Delete an item by key
   */
  async delete(key: DynamoDBKey): Promise<void> {
    const params: DeleteCommandInput = {
      TableName: this.tableName,
      Key: key,
    };

    try {
      await documentClient.send(new DeleteCommand(params));
    } catch (error) {
      logger.error('DynamoDB delete failed', error, { key });
      throw error;
    }
  }

  /**
   * Query items by partition key with optional sort key condition
   */
  async query<T>(
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, unknown>,
    options?: QueryOptions
  ): Promise<PaginatedResult<T>> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: options?.expressionAttributeNames,
      IndexName: options?.indexName,
      Limit: options?.limit,
      ExclusiveStartKey: options?.startKey,
      ScanIndexForward: options?.scanIndexForward ?? true,
      FilterExpression: options?.filterExpression,
    };

    try {
      const result = await documentClient.send(new QueryCommand(params));
      return {
        items: (result.Items || []) as T[],
        lastEvaluatedKey: result.LastEvaluatedKey,
        count: result.Count || 0,
      };
    } catch (error) {
      logger.error('DynamoDB query failed', error, { keyConditionExpression });
      throw error;
    }
  }

  /**
   * Query all items (handles pagination automatically)
   */
  async queryAll<T>(
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, unknown>,
    options?: Omit<QueryOptions, 'limit' | 'startKey'>
  ): Promise<T[]> {
    const allItems: T[] = [];
    let lastKey: Record<string, unknown> | undefined;

    do {
      const result = await this.query<T>(
        keyConditionExpression,
        expressionAttributeValues,
        { ...options, startKey: lastKey, limit: 100 }
      );
      allItems.push(...result.items);
      lastKey = result.lastEvaluatedKey;
    } while (lastKey);

    return allItems;
  }

  /**
   * Scan table (use sparingly - prefer query)
   */
  async scan<T>(options?: {
    filterExpression?: string;
    expressionAttributeNames?: Record<string, string>;
    expressionAttributeValues?: Record<string, unknown>;
    limit?: number;
    startKey?: Record<string, unknown>;
  }): Promise<PaginatedResult<T>> {
    const params: ScanCommandInput = {
      TableName: this.tableName,
      FilterExpression: options?.filterExpression,
      ExpressionAttributeNames: options?.expressionAttributeNames,
      ExpressionAttributeValues: options?.expressionAttributeValues,
      Limit: options?.limit,
      ExclusiveStartKey: options?.startKey,
    };

    try {
      const result = await documentClient.send(new ScanCommand(params));
      return {
        items: (result.Items || []) as T[],
        lastEvaluatedKey: result.LastEvaluatedKey,
        count: result.Count || 0,
      };
    } catch (error) {
      logger.error('DynamoDB scan failed', error);
      throw error;
    }
  }

  /**
   * Batch get multiple items
   */
  async batchGet<T>(keys: DynamoDBKey[]): Promise<T[]> {
    if (keys.length === 0) return [];
    if (keys.length > 100) {
      throw new Error('BatchGet supports maximum 100 items');
    }

    const params: BatchGetCommandInput = {
      RequestItems: {
        [this.tableName]: {
          Keys: keys,
        },
      },
    };

    try {
      const result = await documentClient.send(new BatchGetCommand(params));
      return (result.Responses?.[this.tableName] || []) as T[];
    } catch (error) {
      logger.error('DynamoDB batchGet failed', error, { keyCount: keys.length });
      throw error;
    }
  }

  /**
   * Batch write (put or delete) multiple items
   */
  async batchWrite(
    operations: Array<
      | { put: Record<string, unknown> }
      | { delete: DynamoDBKey }
    >
  ): Promise<void> {
    if (operations.length === 0) return;
    if (operations.length > 25) {
      throw new Error('BatchWrite supports maximum 25 items');
    }

    const writeRequests = operations.map((op) => {
      if ('put' in op) {
        return {
          PutRequest: {
            Item: {
              ...op.put,
              createdAt: op.put['createdAt'] || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        };
      }
      return {
        DeleteRequest: {
          Key: op.delete,
        },
      };
    });

    const params: BatchWriteCommandInput = {
      RequestItems: {
        [this.tableName]: writeRequests,
      },
    };

    try {
      await documentClient.send(new BatchWriteCommand(params));
    } catch (error) {
      logger.error('DynamoDB batchWrite failed', error, { operationCount: operations.length });
      throw error;
    }
  }

  /**
   * Transaction write (atomic operations)
   */
  async transactWrite(
    operations: Array<{
      type: 'Put' | 'Update' | 'Delete' | 'ConditionCheck';
      params: Record<string, unknown>;
    }>
  ): Promise<void> {
    const transactItems = operations.map((op) => {
      const item: Record<string, unknown> = {};
      item[op.type] = {
        TableName: this.tableName,
        ...op.params,
      };
      return item;
    });

    const params: TransactWriteCommandInput = {
      TransactItems: transactItems as TransactWriteCommandInput['TransactItems'],
    };

    try {
      await documentClient.send(new TransactWriteCommand(params));
    } catch (error) {
      logger.error('DynamoDB transactWrite failed', error, { operationCount: operations.length });
      throw error;
    }
  }
}

// Default instance
export const dynamodb = new DynamoDB();

export default dynamodb;
