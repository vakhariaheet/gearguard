/**
 * AWS Client Wrappers - Index
 *
 * Re-exports all client wrappers for easy importing
 */

// DynamoDB
export { DynamoDB, dynamodb, documentClient } from './dynamodb';
export type { DynamoDBKey, QueryOptions, PaginatedResult } from './dynamodb';

// S3
export { S3, s3 } from './s3';
export type {
  S3Object,
  ListObjectsOptions,
  ListObjectsResult,
  UploadOptions,
  PresignedUrlOptions,
} from './s3';

// SQS
export { SQS, sqs } from './sqs';
export type { SQSMessage, SendMessageOptions, ReceiveMessageOptions, QueueStats } from './sqs';

// Gemini AI
export { Gemini, GeminiChat, gemini, createGemini } from './gemini';
export type {
  GeminiModel,
  GenerationConfig,
  SafetySettings,
  GenerateOptions,
  ChatMessage,
  GenerateResult,
  StreamChunk,
} from './gemini';

// SES (Simple Email Service)
export { SES, ses, createSES } from './ses';
export type {
  EmailAddress,
  EmailContent,
  SendEmailOptions,
  SendTemplatedEmailOptions,
  BulkEmailDestination,
  SendBulkEmailOptions,
  SendRawEmailOptions,
  EmailResult,
  BulkEmailResult,
  SendQuota,
  SendStatistics,
} from './ses';
