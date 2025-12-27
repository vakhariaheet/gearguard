/**
 * S3 Client Wrapper
 * 
 * Type-safe wrapper around AWS S3 Client
 * with common operations and presigned URL support.
 */

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  type GetObjectCommandInput,
  type PutObjectCommandInput,
  type DeleteObjectCommandInput,
  type HeadObjectCommandInput,
  type ListObjectsV2CommandInput,
  type CopyObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createLogger } from '../logger';

const logger = createLogger('S3Client');

// =============================================================================
// CLIENT INITIALIZATION
// =============================================================================

const s3Client = new S3Client({
  region: process.env['AWS_REGION'] || process.env['REGION'] || 'ap-south-1',
});

// =============================================================================
// TYPES
// =============================================================================

export interface S3Object {
  key: string;
  size?: number;
  lastModified?: Date;
  etag?: string;
  contentType?: string;
}

export interface ListObjectsOptions {
  prefix?: string;
  delimiter?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface ListObjectsResult {
  objects: S3Object[];
  prefixes: string[];
  isTruncated: boolean;
  nextContinuationToken?: string;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  contentDisposition?: string;
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
  serverSideEncryption?: 'AES256' | 'aws:kms';
}

export interface PresignedUrlOptions {
  expiresIn?: number; // seconds (default: 3600 = 1 hour)
  contentType?: string; // for upload URLs
}

// =============================================================================
// S3 CLIENT CLASS
// =============================================================================

export class S3 {
  private bucket: string;

  constructor(bucket?: string) {
    this.bucket = bucket || process.env['S3_BUCKET'] || '';
    if (!this.bucket) {
      logger.warn('S3 bucket name not configured');
    }
  }

  /**
   * Get object content as string
   */
  async getString(key: string): Promise<string | null> {
    const params: GetObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    try {
      const result = await s3Client.send(new GetObjectCommand(params));
      if (!result.Body) return null;
      return await result.Body.transformToString();
    } catch (error: unknown) {
      if ((error as { name?: string }).name === 'NoSuchKey') {
        return null;
      }
      logger.error('S3 getString failed', error, { key });
      throw error;
    }
  }

  /**
   * Get object content as Buffer
   */
  async getBuffer(key: string): Promise<Buffer | null> {
    const params: GetObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    try {
      const result = await s3Client.send(new GetObjectCommand(params));
      if (!result.Body) return null;
      const bytes = await result.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch (error: unknown) {
      if ((error as { name?: string }).name === 'NoSuchKey') {
        return null;
      }
      logger.error('S3 getBuffer failed', error, { key });
      throw error;
    }
  }

  /**
   * Get object content as JSON
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const content = await this.getString(key);
    if (!content) return null;
    
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      logger.error('S3 getJSON parse failed', error, { key });
      throw error;
    }
  }

  /**
   * Put string content
   */
  async putString(key: string, content: string, options?: UploadOptions): Promise<void> {
    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: content,
      ContentType: options?.contentType || 'text/plain',
      Metadata: options?.metadata,
      CacheControl: options?.cacheControl,
      ContentDisposition: options?.contentDisposition,
      ACL: options?.acl,
      ServerSideEncryption: options?.serverSideEncryption,
    };

    try {
      await s3Client.send(new PutObjectCommand(params));
      logger.debug('S3 putString success', { key });
    } catch (error) {
      logger.error('S3 putString failed', error, { key });
      throw error;
    }
  }

  /**
   * Put Buffer content
   */
  async putBuffer(key: string, content: Buffer, options?: UploadOptions): Promise<void> {
    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: content,
      ContentType: options?.contentType || 'application/octet-stream',
      Metadata: options?.metadata,
      CacheControl: options?.cacheControl,
      ContentDisposition: options?.contentDisposition,
      ACL: options?.acl,
      ServerSideEncryption: options?.serverSideEncryption,
    };

    try {
      await s3Client.send(new PutObjectCommand(params));
      logger.debug('S3 putBuffer success', { key, size: content.length });
    } catch (error) {
      logger.error('S3 putBuffer failed', error, { key });
      throw error;
    }
  }

  /**
   * Put JSON content
   */
  async putJSON<T>(key: string, data: T, options?: UploadOptions): Promise<void> {
    const content = JSON.stringify(data);
    await this.putString(key, content, {
      ...options,
      contentType: options?.contentType || 'application/json',
    });
  }

  /**
   * Delete an object
   */
  async delete(key: string): Promise<void> {
    const params: DeleteObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    try {
      await s3Client.send(new DeleteObjectCommand(params));
      logger.debug('S3 delete success', { key });
    } catch (error) {
      logger.error('S3 delete failed', error, { key });
      throw error;
    }
  }

  /**
   * Check if object exists and get metadata
   */
  async exists(key: string): Promise<S3Object | null> {
    const params: HeadObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    try {
      const result = await s3Client.send(new HeadObjectCommand(params));
      return {
        key,
        size: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
        contentType: result.ContentType,
      };
    } catch (error: unknown) {
      if ((error as { name?: string }).name === 'NotFound') {
        return null;
      }
      logger.error('S3 exists check failed', error, { key });
      throw error;
    }
  }

  /**
   * List objects in bucket/prefix
   */
  async list(options?: ListObjectsOptions): Promise<ListObjectsResult> {
    const params: ListObjectsV2CommandInput = {
      Bucket: this.bucket,
      Prefix: options?.prefix,
      Delimiter: options?.delimiter,
      MaxKeys: options?.maxKeys || 1000,
      ContinuationToken: options?.continuationToken,
    };

    try {
      const result = await s3Client.send(new ListObjectsV2Command(params));
      
      const objects: S3Object[] = (result.Contents || []).map((obj) => ({
        key: obj.Key || '',
        size: obj.Size,
        lastModified: obj.LastModified,
        etag: obj.ETag,
      }));

      const prefixes = (result.CommonPrefixes || []).map((p) => p.Prefix || '');

      return {
        objects,
        prefixes,
        isTruncated: result.IsTruncated || false,
        nextContinuationToken: result.NextContinuationToken,
      };
    } catch (error) {
      logger.error('S3 list failed', error, { prefix: options?.prefix });
      throw error;
    }
  }

  /**
   * Copy object within same bucket or to another bucket
   */
  async copy(sourceKey: string, destinationKey: string, destinationBucket?: string): Promise<void> {
    const params: CopyObjectCommandInput = {
      Bucket: destinationBucket || this.bucket,
      Key: destinationKey,
      CopySource: `${this.bucket}/${sourceKey}`,
    };

    try {
      await s3Client.send(new CopyObjectCommand(params));
      logger.debug('S3 copy success', { sourceKey, destinationKey });
    } catch (error) {
      logger.error('S3 copy failed', error, { sourceKey, destinationKey });
      throw error;
    }
  }

  /**
   * Move object (copy + delete)
   */
  async move(sourceKey: string, destinationKey: string): Promise<void> {
    await this.copy(sourceKey, destinationKey);
    await this.delete(sourceKey);
  }

  /**
   * Generate presigned URL for download
   */
  async getDownloadUrl(key: string, options?: PresignedUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      const url = await getSignedUrl(s3Client, command, {
        expiresIn: options?.expiresIn || 3600,
      });
      return url;
    } catch (error) {
      logger.error('S3 getDownloadUrl failed', error, { key });
      throw error;
    }
  }

  /**
   * Generate presigned URL for upload
   */
  async getUploadUrl(key: string, options?: PresignedUrlOptions): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: options?.contentType,
    });

    try {
      const url = await getSignedUrl(s3Client, command, {
        expiresIn: options?.expiresIn || 3600,
      });
      return url;
    } catch (error) {
      logger.error('S3 getUploadUrl failed', error, { key });
      throw error;
    }
  }
}

// Default instance
export const s3 = new S3();

export default s3;
