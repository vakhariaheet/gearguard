/**
 * AWS SES (Simple Email Service) Client Wrapper
 *
 * Type-safe wrapper around AWS SES Client
 * with common operations for sending emails.
 */

import {
  SESClient,
  SendEmailCommand,
  SendBulkTemplatedEmailCommand,
  SendTemplatedEmailCommand,
  SendRawEmailCommand,
  GetSendQuotaCommand,
  GetSendStatisticsCommand,
  type SendEmailCommandInput,
  type SendTemplatedEmailCommandInput,
  type SendBulkTemplatedEmailCommandInput,
  type SendRawEmailCommandInput,
} from '@aws-sdk/client-ses';
import { createLogger } from '../logger';

const logger = createLogger('SESClient');

// =============================================================================
// CLIENT INITIALIZATION
// =============================================================================

const sesClient = new SESClient({
  region: 'us-east-1',
});

// =============================================================================
// TYPES
// =============================================================================

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailContent {
  subject: string;
  text?: string;
  html?: string;
}

export interface SendEmailOptions {
  from: string | EmailAddress;
  to: string | string[] | EmailAddress | EmailAddress[];
  cc?: string | string[] | EmailAddress | EmailAddress[];
  bcc?: string | string[] | EmailAddress | EmailAddress[];
  replyTo?: string | string[] | EmailAddress | EmailAddress[];
  content: EmailContent;
  configurationSetName?: string;
  tags?: Record<string, string>;
}

export interface SendTemplatedEmailOptions {
  from: string | EmailAddress;
  to: string | string[] | EmailAddress | EmailAddress[];
  cc?: string | string[] | EmailAddress | EmailAddress[];
  bcc?: string | string[] | EmailAddress | EmailAddress[];
  replyTo?: string | string[] | EmailAddress | EmailAddress[];
  templateName: string;
  templateData: Record<string, unknown>;
  configurationSetName?: string;
  tags?: Record<string, string>;
}

export interface BulkEmailDestination {
  to: string | string[] | EmailAddress | EmailAddress[];
  cc?: string | string[] | EmailAddress | EmailAddress[];
  bcc?: string | string[] | EmailAddress | EmailAddress[];
  templateData: Record<string, unknown>;
}

export interface SendBulkEmailOptions {
  from: string | EmailAddress;
  replyTo?: string | string[] | EmailAddress | EmailAddress[];
  templateName: string;
  defaultTemplateData?: Record<string, unknown>;
  destinations: BulkEmailDestination[];
  configurationSetName?: string;
}

export interface SendRawEmailOptions {
  from: string;
  to: string[];
  rawMessage: string | Buffer;
}

export interface EmailResult {
  messageId: string;
}

export interface BulkEmailResult {
  status: Array<{
    status:
      | 'Success'
      | 'MessageRejected'
      | 'AccountSendingPaused'
      | 'ConfigurationSetDoesNotExist'
      | 'ConfigurationSetSendingPaused';
    error?: string;
    messageId?: string;
  }>;
}

export interface SendQuota {
  max24HourSend: number;
  maxSendRate: number;
  sentLast24Hours: number;
}

export interface SendStatistics {
  dataPoints: Array<{
    timestamp: Date;
    deliveryAttempts: number;
    bounces: number;
    complaints: number;
    rejects: number;
  }>;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatAddress = (address: string | EmailAddress): string => {
  if (typeof address === 'string') return address;
  if (address.name) return `${address.name} <${address.email}>`;
  return address.email;
};

const formatAddresses = (
  addresses: string | string[] | EmailAddress | EmailAddress[] | undefined
): string[] | undefined => {
  if (!addresses) return undefined;
  if (typeof addresses === 'string') return [addresses];
  if (Array.isArray(addresses)) {
    return addresses.map(formatAddress);
  }
  return [formatAddress(addresses)];
};

const formatTags = (tags?: Record<string, string>) => {
  if (!tags) return undefined;
  return Object.entries(tags).map(([Name, Value]) => ({ Name, Value }));
};

// =============================================================================
// SES CLIENT CLASS
// =============================================================================

export class SES {
  private defaultFrom: string | undefined;
  private defaultConfigurationSet: string | undefined;

  constructor(options?: { defaultFrom?: string; defaultConfigurationSet?: string }) {
    this.defaultFrom = options?.defaultFrom || process.env['SES_DEFAULT_FROM'];
    this.defaultConfigurationSet =
      options?.defaultConfigurationSet || process.env['SES_CONFIGURATION_SET'];
  }

  /**
   * Send a simple email
   */
  async send(options: SendEmailOptions): Promise<EmailResult> {
    const from = formatAddress(options.from || this.defaultFrom || '');

    if (!from) {
      throw new Error('From address is required');
    }

    const params: SendEmailCommandInput = {
      Source: from,
      Destination: {
        ToAddresses: formatAddresses(options.to),
        CcAddresses: formatAddresses(options.cc),
        BccAddresses: formatAddresses(options.bcc),
      },
      Message: {
        Subject: {
          Data: options.content.subject,
          Charset: 'UTF-8',
        },
        Body: {
          ...(options.content.text && {
            Text: {
              Data: options.content.text,
              Charset: 'UTF-8',
            },
          }),
          ...(options.content.html && {
            Html: {
              Data: options.content.html,
              Charset: 'UTF-8',
            },
          }),
        },
      },
      ReplyToAddresses: formatAddresses(options.replyTo),
      ConfigurationSetName: options.configurationSetName || this.defaultConfigurationSet,
      Tags: formatTags(options.tags),
    };

    try {
      const result = await sesClient.send(new SendEmailCommand(params));
      logger.debug('SES send success', { messageId: result.MessageId });
      return { messageId: result.MessageId || '' };
    } catch (error) {
      logger.error('SES send failed', error);
      throw error;
    }
  }

  /**
   * Send a templated email
   */
  async sendTemplated(options: SendTemplatedEmailOptions): Promise<EmailResult> {
    const from = formatAddress(options.from || this.defaultFrom || '');

    if (!from) {
      throw new Error('From address is required');
    }

    const params: SendTemplatedEmailCommandInput = {
      Source: from,
      Destination: {
        ToAddresses: formatAddresses(options.to),
        CcAddresses: formatAddresses(options.cc),
        BccAddresses: formatAddresses(options.bcc),
      },
      Template: options.templateName,
      TemplateData: JSON.stringify(options.templateData),
      ReplyToAddresses: formatAddresses(options.replyTo),
      ConfigurationSetName: options.configurationSetName || this.defaultConfigurationSet,
      Tags: formatTags(options.tags),
    };

    try {
      const result = await sesClient.send(new SendTemplatedEmailCommand(params));
      logger.debug('SES sendTemplated success', { messageId: result.MessageId });
      return { messageId: result.MessageId || '' };
    } catch (error) {
      logger.error('SES sendTemplated failed', error);
      throw error;
    }
  }

  /**
   * Send bulk templated emails (max 50 destinations)
   */
  async sendBulk(options: SendBulkEmailOptions): Promise<BulkEmailResult> {
    const from = formatAddress(options.from || this.defaultFrom || '');

    if (!from) {
      throw new Error('From address is required');
    }

    if (options.destinations.length > 50) {
      throw new Error('SES bulk send supports maximum 50 destinations');
    }

    const params: SendBulkTemplatedEmailCommandInput = {
      Source: from,
      Template: options.templateName,
      DefaultTemplateData: options.defaultTemplateData
        ? JSON.stringify(options.defaultTemplateData)
        : '{}',
      Destinations: options.destinations.map((dest) => ({
        Destination: {
          ToAddresses: formatAddresses(dest.to),
          CcAddresses: formatAddresses(dest.cc),
          BccAddresses: formatAddresses(dest.bcc),
        },
        ReplacementTemplateData: JSON.stringify(dest.templateData),
      })),
      ReplyToAddresses: formatAddresses(options.replyTo),
      ConfigurationSetName: options.configurationSetName || this.defaultConfigurationSet,
    };

    try {
      const result = await sesClient.send(new SendBulkTemplatedEmailCommand(params));

      const status = (result.Status || []).map((s) => ({
        status: s.Status as BulkEmailResult['status'][0]['status'],
        error: s.Error,
        messageId: s.MessageId,
      }));

      logger.debug('SES sendBulk completed', {
        total: status.length,
        successful: status.filter((s) => s.status === 'Success').length,
      });

      return { status };
    } catch (error) {
      logger.error('SES sendBulk failed', error);
      throw error;
    }
  }

  /**
   * Send a raw email (with attachments)
   */
  async sendRaw(options: SendRawEmailOptions): Promise<EmailResult> {
    const rawMessage =
      typeof options.rawMessage === 'string' ? Buffer.from(options.rawMessage) : options.rawMessage;

    const params: SendRawEmailCommandInput = {
      Source: options.from,
      Destinations: options.to,
      RawMessage: {
        Data: new Uint8Array(rawMessage),
      },
    };

    try {
      const result = await sesClient.send(new SendRawEmailCommand(params));
      logger.debug('SES sendRaw success', { messageId: result.MessageId });
      return { messageId: result.MessageId || '' };
    } catch (error) {
      logger.error('SES sendRaw failed', error);
      throw error;
    }
  }

  /**
   * Get sending quota
   */
  async getQuota(): Promise<SendQuota> {
    try {
      const result = await sesClient.send(new GetSendQuotaCommand({}));
      return {
        max24HourSend: result.Max24HourSend || 0,
        maxSendRate: result.MaxSendRate || 0,
        sentLast24Hours: result.SentLast24Hours || 0,
      };
    } catch (error) {
      logger.error('SES getQuota failed', error);
      throw error;
    }
  }

  /**
   * Get sending statistics
   */
  async getStatistics(): Promise<SendStatistics> {
    try {
      const result = await sesClient.send(new GetSendStatisticsCommand({}));

      const dataPoints = (result.SendDataPoints || []).map((dp) => ({
        timestamp: dp.Timestamp || new Date(),
        deliveryAttempts: dp.DeliveryAttempts || 0,
        bounces: dp.Bounces || 0,
        complaints: dp.Complaints || 0,
        rejects: dp.Rejects || 0,
      }));

      return { dataPoints };
    } catch (error) {
      logger.error('SES getStatistics failed', error);
      throw error;
    }
  }

  // ===========================================================================
  // CONVENIENCE METHODS
  // ===========================================================================

  /**
   * Send a simple text email
   */
  async sendText(
    to: string | string[],
    subject: string,
    text: string,
    from?: string
  ): Promise<EmailResult> {
    return this.send({
      from: from || this.defaultFrom || '',
      to,
      content: { subject, text },
    });
  }

  /**
   * Send an HTML email
   */
  async sendHtml(
    to: string | string[],
    subject: string,
    html: string,
    from?: string
  ): Promise<EmailResult> {
    return this.send({
      from: from || this.defaultFrom || '',
      to,
      content: { subject, html },
    });
  }

  /**
   * Send email with both text and HTML versions
   */
  async sendMultipart(
    to: string | string[],
    subject: string,
    text: string,
    html: string,
    from?: string
  ): Promise<EmailResult> {
    return this.send({
      from: from || this.defaultFrom || '',
      to,
      content: { subject, text, html },
    });
  }
}

// Default instance
export const ses = new SES();

/**
 * Create an SES instance with custom configuration
 */
export const createSES = (options?: {
  defaultFrom?: string;
  defaultConfigurationSet?: string;
}): SES => {
  return new SES(options);
};

export default ses;
