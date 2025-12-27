/**
 * SQS Client Wrapper
 * 
 * Type-safe wrapper around AWS SQS Client
 * with common operations for message queuing.
 */

import {
  SQSClient,
  SendMessageCommand,
  SendMessageBatchCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  DeleteMessageBatchCommand,
  GetQueueAttributesCommand,
  ChangeMessageVisibilityCommand,
  type SendMessageCommandInput,
  type SendMessageBatchCommandInput,
  type ReceiveMessageCommandInput,
  type DeleteMessageCommandInput,
  type DeleteMessageBatchCommandInput,
  type GetQueueAttributesCommandInput,
  type ChangeMessageVisibilityCommandInput,
  type Message,
} from '@aws-sdk/client-sqs';
import { createLogger } from '../logger';

const logger = createLogger('SQSClient');

// =============================================================================
// CLIENT INITIALIZATION
// =============================================================================

const sqsClient = new SQSClient({
  region: process.env['AWS_REGION'] || process.env['REGION'] || 'ap-south-1',
});

// =============================================================================
// TYPES
// =============================================================================

export interface SQSMessage<T = unknown> {
  messageId: string;
  receiptHandle: string;
  body: T;
  attributes?: Record<string, string>;
  messageAttributes?: Record<string, {
    stringValue?: string;
    binaryValue?: Uint8Array;
    dataType: string;
  }>;
  approximateReceiveCount?: number;
  sentTimestamp?: number;
}

export interface SendMessageOptions {
  delaySeconds?: number;
  messageGroupId?: string; // For FIFO queues
  messageDeduplicationId?: string; // For FIFO queues
  messageAttributes?: Record<string, {
    DataType: 'String' | 'Number' | 'Binary';
    StringValue?: string;
    BinaryValue?: Uint8Array;
  }>;
}

export interface ReceiveMessageOptions {
  maxNumberOfMessages?: number; // 1-10, default 1
  visibilityTimeout?: number; // seconds
  waitTimeSeconds?: number; // 0-20 for long polling
  attributeNames?: Array<'All' | 'ApproximateFirstReceiveTimestamp' | 'ApproximateReceiveCount' | 'SenderId' | 'SentTimestamp'>;
  messageAttributeNames?: string[];
}

export interface QueueStats {
  approximateNumberOfMessages: number;
  approximateNumberOfMessagesNotVisible: number;
  approximateNumberOfMessagesDelayed: number;
}

// =============================================================================
// SQS CLIENT CLASS
// =============================================================================

export class SQS {
  private queueUrl: string;

  constructor(queueUrl?: string) {
    this.queueUrl = queueUrl || process.env['SQS_QUEUE_URL'] || '';
    if (!this.queueUrl) {
      logger.warn('SQS queue URL not configured');
    }
  }

  /**
   * Send a single message to the queue
   */
  async send<T>(body: T, options?: SendMessageOptions): Promise<string> {
    const messageBody = typeof body === 'string' ? body : JSON.stringify(body);

    const params: SendMessageCommandInput = {
      QueueUrl: this.queueUrl,
      MessageBody: messageBody,
      DelaySeconds: options?.delaySeconds,
      MessageGroupId: options?.messageGroupId,
      MessageDeduplicationId: options?.messageDeduplicationId,
      MessageAttributes: options?.messageAttributes,
    };

    try {
      const result = await sqsClient.send(new SendMessageCommand(params));
      logger.debug('SQS send success', { messageId: result.MessageId });
      return result.MessageId || '';
    } catch (error) {
      logger.error('SQS send failed', error);
      throw error;
    }
  }

  /**
   * Send multiple messages in batch (max 10)
   */
  async sendBatch<T>(
    messages: Array<{ id: string; body: T; options?: SendMessageOptions }>
  ): Promise<{ successful: string[]; failed: Array<{ id: string; code: string; message: string }> }> {
    if (messages.length === 0) {
      return { successful: [], failed: [] };
    }
    if (messages.length > 10) {
      throw new Error('SQS batch send supports maximum 10 messages');
    }

    const params: SendMessageBatchCommandInput = {
      QueueUrl: this.queueUrl,
      Entries: messages.map((msg) => ({
        Id: msg.id,
        MessageBody: typeof msg.body === 'string' ? msg.body : JSON.stringify(msg.body),
        DelaySeconds: msg.options?.delaySeconds,
        MessageGroupId: msg.options?.messageGroupId,
        MessageDeduplicationId: msg.options?.messageDeduplicationId,
        MessageAttributes: msg.options?.messageAttributes,
      })),
    };

    try {
      const result = await sqsClient.send(new SendMessageBatchCommand(params));
      
      const successful = (result.Successful || []).map((s) => s.Id || '');
      const failed = (result.Failed || []).map((f) => ({
        id: f.Id || '',
        code: f.Code || '',
        message: f.Message || '',
      }));

      logger.debug('SQS sendBatch completed', { 
        successCount: successful.length, 
        failCount: failed.length 
      });

      return { successful, failed };
    } catch (error) {
      logger.error('SQS sendBatch failed', error);
      throw error;
    }
  }

  /**
   * Receive messages from the queue
   */
  async receive<T>(options?: ReceiveMessageOptions): Promise<SQSMessage<T>[]> {
    const params: ReceiveMessageCommandInput = {
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: options?.maxNumberOfMessages || 1,
      VisibilityTimeout: options?.visibilityTimeout,
      WaitTimeSeconds: options?.waitTimeSeconds || 0,
      MessageSystemAttributeNames: ['All'],
      MessageAttributeNames: options?.messageAttributeNames || ['All'],
    };

    try {
      const result = await sqsClient.send(new ReceiveMessageCommand(params));
      
      const messages: SQSMessage<T>[] = (result.Messages || []).map((msg: Message) => {
        let body: T;
        try {
          body = JSON.parse(msg.Body || '{}') as T;
        } catch {
          body = msg.Body as T;
        }

        return {
          messageId: msg.MessageId || '',
          receiptHandle: msg.ReceiptHandle || '',
          body,
          attributes: msg.Attributes,
          messageAttributes: msg.MessageAttributes as SQSMessage<T>['messageAttributes'],
          approximateReceiveCount: msg.Attributes?.ApproximateReceiveCount 
            ? parseInt(msg.Attributes.ApproximateReceiveCount) 
            : undefined,
          sentTimestamp: msg.Attributes?.SentTimestamp 
            ? parseInt(msg.Attributes.SentTimestamp) 
            : undefined,
        };
      });

      logger.debug('SQS receive completed', { messageCount: messages.length });
      return messages;
    } catch (error) {
      logger.error('SQS receive failed', error);
      throw error;
    }
  }

  /**
   * Delete a message from the queue (after processing)
   */
  async delete(receiptHandle: string): Promise<void> {
    const params: DeleteMessageCommandInput = {
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    };

    try {
      await sqsClient.send(new DeleteMessageCommand(params));
      logger.debug('SQS delete success');
    } catch (error) {
      logger.error('SQS delete failed', error);
      throw error;
    }
  }

  /**
   * Delete multiple messages in batch (max 10)
   */
  async deleteBatch(
    entries: Array<{ id: string; receiptHandle: string }>
  ): Promise<{ successful: string[]; failed: Array<{ id: string; code: string; message: string }> }> {
    if (entries.length === 0) {
      return { successful: [], failed: [] };
    }
    if (entries.length > 10) {
      throw new Error('SQS batch delete supports maximum 10 messages');
    }

    const params: DeleteMessageBatchCommandInput = {
      QueueUrl: this.queueUrl,
      Entries: entries.map((e) => ({
        Id: e.id,
        ReceiptHandle: e.receiptHandle,
      })),
    };

    try {
      const result = await sqsClient.send(new DeleteMessageBatchCommand(params));
      
      const successful = (result.Successful || []).map((s) => s.Id || '');
      const failed = (result.Failed || []).map((f) => ({
        id: f.Id || '',
        code: f.Code || '',
        message: f.Message || '',
      }));

      logger.debug('SQS deleteBatch completed', { 
        successCount: successful.length, 
        failCount: failed.length 
      });

      return { successful, failed };
    } catch (error) {
      logger.error('SQS deleteBatch failed', error);
      throw error;
    }
  }

  /**
   * Change message visibility timeout
   */
  async changeVisibility(receiptHandle: string, visibilityTimeout: number): Promise<void> {
    const params: ChangeMessageVisibilityCommandInput = {
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
      VisibilityTimeout: visibilityTimeout,
    };

    try {
      await sqsClient.send(new ChangeMessageVisibilityCommand(params));
      logger.debug('SQS changeVisibility success', { visibilityTimeout });
    } catch (error) {
      logger.error('SQS changeVisibility failed', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    const params: GetQueueAttributesCommandInput = {
      QueueUrl: this.queueUrl,
      AttributeNames: [
        'ApproximateNumberOfMessages',
        'ApproximateNumberOfMessagesNotVisible',
        'ApproximateNumberOfMessagesDelayed',
      ],
    };

    try {
      const result = await sqsClient.send(new GetQueueAttributesCommand(params));
      const attrs = result.Attributes || {};

      return {
        approximateNumberOfMessages: parseInt(attrs['ApproximateNumberOfMessages'] || '0'),
        approximateNumberOfMessagesNotVisible: parseInt(attrs['ApproximateNumberOfMessagesNotVisible'] || '0'),
        approximateNumberOfMessagesDelayed: parseInt(attrs['ApproximateNumberOfMessagesDelayed'] || '0'),
      };
    } catch (error) {
      logger.error('SQS getStats failed', error);
      throw error;
    }
  }

  /**
   * Process messages with automatic deletion on success
   */
  async process<T>(
    handler: (message: SQSMessage<T>) => Promise<void>,
    options?: ReceiveMessageOptions & { batchSize?: number }
  ): Promise<{ processed: number; failed: number }> {
    const messages = await this.receive<T>({
      ...options,
      maxNumberOfMessages: options?.batchSize || options?.maxNumberOfMessages || 10,
    });

    let processed = 0;
    let failed = 0;

    for (const message of messages) {
      try {
        await handler(message);
        await this.delete(message.receiptHandle);
        processed++;
      } catch (error) {
        logger.error('SQS message processing failed', error, { messageId: message.messageId });
        failed++;
        // Don't delete - message will return to queue after visibility timeout
      }
    }

    return { processed, failed };
  }
}

// Default instance
export const sqs = new SQS();

export default sqs;
