// Mock AWS SDK
const mockSend = jest.fn();

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({ send: mockSend })),
  },
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  DeleteCommand: jest.fn(),
  QueryCommand: jest.fn(),
  ScanCommand: jest.fn(),
  BatchGetCommand: jest.fn(),
  BatchWriteCommand: jest.fn(),
  TransactWriteCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(),
}));

import { DynamoDB, DynamoDBKey } from '../../../src/shared/clients/dynamodb';

describe('DynamoDB Client', () => {
  let dynamodb: DynamoDB;
  const testTableName = 'test-table';

  beforeEach(() => {
    jest.clearAllMocks();
    dynamodb = new DynamoDB(testTableName);
  });

  describe('get', () => {
    it('should get item successfully', async () => {
      const mockItem = { PK: 'test', SK: 'item', data: 'value' };
      mockSend.mockResolvedValue({ Item: mockItem });

      const key: DynamoDBKey = { PK: 'test', SK: 'item' };
      const result = await dynamodb.get(key);

      expect(result).toEqual(mockItem);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return null when item not found', async () => {
      mockSend.mockResolvedValue({});

      const key: DynamoDBKey = { PK: 'test', SK: 'item' };
      const result = await dynamodb.get(key);

      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      const key: DynamoDBKey = { PK: 'test', SK: 'item' };

      await expect(dynamodb.get(key)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('put', () => {
    it('should put item successfully', async () => {
      mockSend.mockResolvedValue({});

      const item = { PK: 'test', SK: 'item', data: 'value' };
      const result = await dynamodb.put(item);

      expect(result).toMatchObject(item);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should preserve existing createdAt', async () => {
      mockSend.mockResolvedValue({});

      const existingCreatedAt = '2023-01-01T00:00:00.000Z';
      const item = { PK: 'test', SK: 'item', data: 'value', createdAt: existingCreatedAt };
      const result = await dynamodb.put(item);

      expect(result.createdAt).toBe(existingCreatedAt);
      expect(result.updatedAt).toBeDefined();
    });

    it('should handle errors', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      const item = { PK: 'test', SK: 'item', data: 'value' };

      await expect(dynamodb.put(item)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('update', () => {
    it('should update item successfully', async () => {
      const updatedItem = {
        PK: 'test',
        SK: 'item',
        data: 'updated',
        updatedAt: new Date().toISOString(),
      };
      mockSend.mockResolvedValue({ Attributes: updatedItem });

      const key: DynamoDBKey = { PK: 'test', SK: 'item' };
      const updates = { data: 'updated' };
      const result = await dynamodb.update(key, updates);

      expect(result).toEqual(updatedItem);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should throw error when no fields to update', async () => {
      const key: DynamoDBKey = { PK: 'test', SK: 'item' };
      const updates = {};

      await expect(dynamodb.update(key, updates)).rejects.toThrow('No fields to update');
    });

    it('should handle errors', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      const key: DynamoDBKey = { PK: 'test', SK: 'item' };
      const updates = { data: 'updated' };

      await expect(dynamodb.update(key, updates)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('delete', () => {
    it('should delete item successfully', async () => {
      mockSend.mockResolvedValue({});

      const key: DynamoDBKey = { PK: 'test', SK: 'item' };
      await dynamodb.delete(key);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      const key: DynamoDBKey = { PK: 'test', SK: 'item' };

      await expect(dynamodb.delete(key)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('query', () => {
    it('should query items successfully', async () => {
      const mockItems = [
        { PK: 'test', SK: 'item1', data: 'value1' },
        { PK: 'test', SK: 'item2', data: 'value2' },
      ];
      mockSend.mockResolvedValue({
        Items: mockItems,
        Count: 2,
        LastEvaluatedKey: { PK: 'test', SK: 'item2' },
      });

      const result = await dynamodb.query('PK = :pk', { ':pk': 'test' });

      expect(result.items).toEqual(mockItems);
      expect(result.count).toBe(2);
      expect(result.lastEvaluatedKey).toEqual({ PK: 'test', SK: 'item2' });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      await expect(dynamodb.query('PK = :pk', { ':pk': 'test' })).rejects.toThrow('DynamoDB error');
    });
  });

  describe('scan', () => {
    it('should scan items successfully', async () => {
      const mockItems = [
        { PK: 'test1', SK: 'item1', data: 'value1' },
        { PK: 'test2', SK: 'item2', data: 'value2' },
      ];
      mockSend.mockResolvedValue({
        Items: mockItems,
        Count: 2,
      });

      const result = await dynamodb.scan();

      expect(result.items).toEqual(mockItems);
      expect(result.count).toBe(2);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      await expect(dynamodb.scan()).rejects.toThrow('DynamoDB error');
    });
  });

  describe('batchGet', () => {
    it('should batch get items successfully', async () => {
      const mockItems = [
        { PK: 'test1', SK: 'item1', data: 'value1' },
        { PK: 'test2', SK: 'item2', data: 'value2' },
      ];
      mockSend.mockResolvedValue({
        Responses: { [testTableName]: mockItems },
      });

      const keys: DynamoDBKey[] = [
        { PK: 'test1', SK: 'item1' },
        { PK: 'test2', SK: 'item2' },
      ];
      const result = await dynamodb.batchGet(keys);

      expect(result).toEqual(mockItems);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return empty array for empty keys', async () => {
      const result = await dynamodb.batchGet([]);
      expect(result).toEqual([]);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should throw error for too many keys', async () => {
      const keys = Array(101).fill({ PK: 'test', SK: 'item' });
      await expect(dynamodb.batchGet(keys)).rejects.toThrow('BatchGet supports maximum 100 items');
    });

    it('should handle errors', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      const keys: DynamoDBKey[] = [{ PK: 'test', SK: 'item' }];
      await expect(dynamodb.batchGet(keys)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('batchWrite', () => {
    it('should batch write items successfully', async () => {
      mockSend.mockResolvedValue({});

      const operations = [
        { put: { PK: 'test1', SK: 'item1', data: 'value1' } },
        { delete: { PK: 'test2', SK: 'item2' } },
      ];
      await dynamodb.batchWrite(operations);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return early for empty operations', async () => {
      await dynamodb.batchWrite([]);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should throw error for too many operations', async () => {
      const operations = Array(26).fill({ put: { PK: 'test', SK: 'item' } });
      await expect(dynamodb.batchWrite(operations)).rejects.toThrow(
        'BatchWrite supports maximum 25 items'
      );
    });

    it('should handle errors', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      const operations = [{ put: { PK: 'test', SK: 'item', data: 'value' } }];
      await expect(dynamodb.batchWrite(operations)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('transactWrite', () => {
    it('should transact write successfully', async () => {
      mockSend.mockResolvedValue({});

      const operations = [
        { type: 'Put' as const, params: { Item: { PK: 'test', SK: 'item' } } },
        { type: 'Delete' as const, params: { Key: { PK: 'test2', SK: 'item2' } } },
      ];
      await dynamodb.transactWrite(operations);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      const operations = [{ type: 'Put' as const, params: { Item: { PK: 'test', SK: 'item' } } }];
      await expect(dynamodb.transactWrite(operations)).rejects.toThrow('DynamoDB error');
    });
  });
});
