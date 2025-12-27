/**
 * Google Gemini AI Client Wrapper
 *
 * Type-safe wrapper around the new unified Google Gen AI SDK
 * with common operations for text generation, chat, and multimodal.
 *
 * @see https://ai.google.dev/gemini-api/docs
 */

import { GoogleGenAI, Chat, Content, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { createLogger } from '../logger';

const logger = createLogger('GeminiClient');

// =============================================================================
// CLIENT INITIALIZATION
// =============================================================================

const createGeminiClient = (): GoogleGenAI => {
  const apiKey = process.env['GEMINI_API_KEY'] || process.env['GOOGLE_AI_API_KEY'];

  if (!apiKey) {
    logger.warn('Gemini API key not configured (GEMINI_API_KEY or GOOGLE_AI_API_KEY)');
  }

  return new GoogleGenAI({ apiKey: apiKey || '' });
};

const genAI = createGeminiClient();

// =============================================================================
// TYPES
// =============================================================================

/**
 * Available Gemini Models (as of January 2025)
 *
 * Gemini 3 Series (Latest - Recommended):
 * - gemini-3-pro-preview: Most intelligent model with multimodal understanding and agentic capabilities
 * - gemini-3-flash-preview: Frontier intelligence built for speed, combining intelligence with superior search
 * - gemini-3-pro-image-preview: Image generation and editing with advanced visual reasoning
 *
 * Gemini 2.5 Series (Stable - Production Ready):
 * - gemini-2.5-flash: Best price-performance, well-rounded capabilities, 1M context
 * - gemini-2.5-flash-lite: Fastest flash model optimized for cost-efficiency and high throughput
 * - gemini-2.5-pro: Advanced thinking model for complex reasoning in code, math, and STEM
 * - gemini-2.5-flash-image: Image generation and editing capabilities
 */
export type GeminiModel =
  // Gemini 3 Series (Latest - Recommended)
  | 'gemini-3-pro-preview'
  | 'gemini-3-flash-preview'
  | 'gemini-3-pro-image-preview'
  // Gemini 2.5 Series (Stable - Production Ready)
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash-image';

export interface GenerationConfig {
  temperature?: number; // 0.0 - 2.0, default 1.0
  topP?: number; // 0.0 - 1.0
  topK?: number; // 1 - 100
  maxOutputTokens?: number; // Max tokens in response
  stopSequences?: string[]; // Stop generation at these sequences
  candidateCount?: number; // Number of response candidates
  presencePenalty?: number; // Presence penalty for diversity
  frequencyPenalty?: number; // Frequency penalty for diversity
}

export type SafetyThreshold =
  | 'BLOCK_NONE'
  | 'BLOCK_LOW_AND_ABOVE'
  | 'BLOCK_MEDIUM_AND_ABOVE'
  | 'BLOCK_ONLY_HIGH';

export interface SafetySettings {
  harassment?: SafetyThreshold;
  hateSpeech?: SafetyThreshold;
  sexuallyExplicit?: SafetyThreshold;
  dangerousContent?: SafetyThreshold;
}

export interface GenerateOptions {
  model?: GeminiModel;
  config?: GenerationConfig;
  safety?: SafetySettings;
  systemInstruction?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface GenerateResult {
  text: string;
  finishReason?: string;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export interface ImageGenerateResult {
  images: Array<{
    data: string; // Base64 encoded image data
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  }>;
  text?: string;
  finishReason?: string;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export interface StreamChunk {
  text: string;
  isComplete: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const thresholdMap: Record<SafetyThreshold, HarmBlockThreshold> = {
  BLOCK_NONE: HarmBlockThreshold.BLOCK_NONE,
  BLOCK_LOW_AND_ABOVE: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  BLOCK_MEDIUM_AND_ABOVE: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  BLOCK_ONLY_HIGH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
};

const buildSafetySettings = (safety?: SafetySettings) => {
  if (!safety) return undefined;

  const settings = [];

  if (safety.harassment) {
    settings.push({
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: thresholdMap[safety.harassment],
    });
  }
  if (safety.hateSpeech) {
    settings.push({
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: thresholdMap[safety.hateSpeech],
    });
  }
  if (safety.sexuallyExplicit) {
    settings.push({
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: thresholdMap[safety.sexuallyExplicit],
    });
  }
  if (safety.dangerousContent) {
    settings.push({
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: thresholdMap[safety.dangerousContent],
    });
  }

  return settings.length > 0 ? settings : undefined;
};

// =============================================================================
// GEMINI CLIENT CLASS
// =============================================================================

export class Gemini {
  private defaultModel: GeminiModel;
  private defaultConfig?: GenerationConfig;
  private defaultSafety?: SafetySettings;
  private systemInstruction?: string;

  constructor(options?: {
    model?: GeminiModel;
    config?: GenerationConfig;
    safety?: SafetySettings;
    systemInstruction?: string;
  }) {
    // Default to gemini-3-flash-preview (latest recommended for most use cases)
    this.defaultModel = options?.model || 'gemini-3-flash-preview';
    this.defaultConfig = options?.config;
    this.defaultSafety = options?.safety;
    this.systemInstruction = options?.systemInstruction;
  }

  /**
   * Build configuration object for API calls
   */
  private buildConfig(options?: GenerateOptions) {
    const config = options?.config || this.defaultConfig;
    const safety = options?.safety || this.defaultSafety;
    const systemInstruction = options?.systemInstruction || this.systemInstruction;

    return {
      ...(config && {
        temperature: config.temperature,
        topP: config.topP,
        topK: config.topK,
        maxOutputTokens: config.maxOutputTokens,
        stopSequences: config.stopSequences,
        candidateCount: config.candidateCount,
        presencePenalty: config.presencePenalty,
        frequencyPenalty: config.frequencyPenalty,
      }),
      safetySettings: buildSafetySettings(safety),
      systemInstruction,
    };
  }

  /**
   * Generate text from a prompt
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const model = options?.model || this.defaultModel;
    const config = this.buildConfig(options);

    try {
      const response = await genAI.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      const candidate = response.candidates?.[0];
      const text = response.text || '';

      logger.debug('Gemini generate success', {
        model,
        promptLength: prompt.length,
        responseLength: text.length,
      });

      return {
        text,
        finishReason: candidate?.finishReason as string | undefined,
        safetyRatings: candidate?.safetyRatings?.map((r) => ({
          category: r.category as string,
          probability: r.probability as string,
        })),
        usageMetadata: response.usageMetadata
          ? {
              promptTokenCount: response.usageMetadata.promptTokenCount || 0,
              candidatesTokenCount: response.usageMetadata.candidatesTokenCount || 0,
              totalTokenCount: response.usageMetadata.totalTokenCount || 0,
            }
          : undefined,
      };
    } catch (error) {
      logger.error('Gemini generate failed', error);
      throw error;
    }
  }

  /**
   * Generate text with streaming response
   */
  async *generateStream(prompt: string, options?: GenerateOptions): AsyncGenerator<StreamChunk> {
    const model = options?.model || this.defaultModel;
    const config = this.buildConfig(options);

    try {
      const response = await genAI.models.generateContentStream({
        model,
        contents: prompt,
        config,
      });

      for await (const chunk of response) {
        const text = chunk.text || '';
        yield {
          text,
          isComplete: false,
        };
      }

      yield {
        text: '',
        isComplete: true,
      };

      logger.debug('Gemini stream complete', { model });
    } catch (error) {
      logger.error('Gemini generateStream failed', error);
      throw error;
    }
  }

  /**
   * Generate text with image input (multimodal)
   */
  async generateWithImage(
    prompt: string,
    imageData: {
      data: string; // Base64 encoded image data
      mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
    },
    options?: GenerateOptions
  ): Promise<GenerateResult> {
    const model = options?.model || this.defaultModel;
    const config = this.buildConfig(options);

    try {
      const response = await genAI.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: imageData.data,
                  mimeType: imageData.mimeType,
                },
              },
            ],
          },
        ],
        config,
      });

      const candidate = response.candidates?.[0];
      const text = response.text || '';

      logger.debug('Gemini generateWithImage success', { model });

      return {
        text,
        finishReason: candidate?.finishReason as string | undefined,
        safetyRatings: candidate?.safetyRatings?.map((r) => ({
          category: r.category as string,
          probability: r.probability as string,
        })),
        usageMetadata: response.usageMetadata
          ? {
              promptTokenCount: response.usageMetadata.promptTokenCount || 0,
              candidatesTokenCount: response.usageMetadata.candidatesTokenCount || 0,
              totalTokenCount: response.usageMetadata.totalTokenCount || 0,
            }
          : undefined,
      };
    } catch (error) {
      logger.error('Gemini generateWithImage failed', error);
      throw error;
    }
  }

  /**
   * Start a chat session
   */
  startChat(history?: ChatMessage[], options?: GenerateOptions): GeminiChat {
    const model = options?.model || this.defaultModel;
    const config = this.buildConfig(options);

    const formattedHistory: Content[] | undefined = history?.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    const chat = genAI.chats.create({
      model,
      history: formattedHistory,
      config,
    });

    return new GeminiChat(chat);
  }

  /**
   * Count tokens in a text
   */
  async countTokens(text: string, options?: GenerateOptions): Promise<number> {
    const model = options?.model || this.defaultModel;

    try {
      const response = await genAI.models.countTokens({
        model,
        contents: text,
      });
      return response.totalTokens || 0;
    } catch (error) {
      logger.error('Gemini countTokens failed', error);
      throw error;
    }
  }

  /**
   * Generate JSON output (with structured output)
   */
  async generateJSON<T>(prompt: string, options?: GenerateOptions): Promise<T> {
    const enhancedPrompt = `${prompt}\n\nRespond with valid JSON only. No markdown, no explanation, just the JSON object.`;

    const result = await this.generate(enhancedPrompt, options);

    try {
      // Clean up response - remove markdown code blocks if present
      let jsonText = result.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      }
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }

      return JSON.parse(jsonText.trim()) as T;
    } catch (error) {
      logger.error('Gemini generateJSON parse failed', error, { response: result.text });
      throw new Error(`Failed to parse Gemini response as JSON: ${result.text}`);
    }
  }

  /**
   * Generate with thinking mode (for complex reasoning - Gemini 2.5+ and 3.0+)
   *
   * Thinking mode is available on gemini-2.5-flash, gemini-2.5-pro, and all Gemini 3 models.
   * It enables step-by-step reasoning for complex problems.
   */
  async generateWithThinking(
    prompt: string,
    options?: GenerateOptions
  ): Promise<GenerateResult & { thinkingProcess?: string }> {
    // Use gemini-3-flash-preview for best thinking capabilities
    const model = options?.model || 'gemini-3-flash-preview';

    const result = await this.generate(prompt, {
      ...options,
      model,
    });

    return result;
  }

  /**
   * Generate images from text prompts
   *
   * Uses Gemini 3 Pro Image or Gemini 2.5 Flash Image for image generation.
   * Supports creating, editing, and enhancing images based on text descriptions.
   */
  async generateImage(
    prompt: string,
    options?: GenerateOptions & {
      aspectRatio?: '1:1' | '9:16' | '16:9' | '4:3' | '3:4';
      style?:
        | 'photographic'
        | 'digital_art'
        | 'sketch'
        | 'watercolor'
        | 'oil_painting'
        | 'cartoon'
        | 'anime';
      quality?: 'standard' | 'high';
    }
  ): Promise<ImageGenerateResult> {
    // Use gemini-3-pro-image-preview for best image generation capabilities
    const model = options?.model || 'gemini-3-pro-image-preview';
    const config = this.buildConfig(options);

    // Enhance prompt with style and quality preferences
    let enhancedPrompt = prompt;
    if (options?.style) {
      enhancedPrompt += ` in ${options.style.replace('_', ' ')} style`;
    }
    if (options?.quality === 'high') {
      enhancedPrompt += ', high quality, detailed';
    }

    try {
      const response = await genAI.models.generateContent({
        model,
        contents: enhancedPrompt,
        config: {
          ...config,
          ...(options?.aspectRatio && { aspectRatio: options.aspectRatio }),
        },
      });

      const candidate = response.candidates?.[0];
      const text = response.text || '';

      // Extract image data from response
      const images: Array<{ data: string; mimeType: 'image/png' | 'image/jpeg' | 'image/webp' }> =
        [];

      // Note: The actual image extraction logic depends on the API response format
      // This is a placeholder implementation - you may need to adjust based on actual API response
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            images.push({
              data: part.inlineData.data,
              mimeType: part.inlineData.mimeType as 'image/png' | 'image/jpeg' | 'image/webp',
            });
          }
        }
      }

      logger.debug('Gemini generateImage success', {
        model,
        promptLength: prompt.length,
        imageCount: images.length,
      });

      return {
        images,
        text,
        finishReason: candidate?.finishReason as string | undefined,
        usageMetadata: response.usageMetadata
          ? {
              promptTokenCount: response.usageMetadata.promptTokenCount || 0,
              candidatesTokenCount: response.usageMetadata.candidatesTokenCount || 0,
              totalTokenCount: response.usageMetadata.totalTokenCount || 0,
            }
          : undefined,
      };
    } catch (error) {
      logger.error('Gemini generateImage failed', error);
      throw error;
    }
  }

  /**
   * Edit or enhance existing images with text instructions
   *
   * Takes an existing image and modifies it based on text instructions.
   */
  async editImage(
    prompt: string,
    imageData: {
      data: string; // Base64 encoded image data
      mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
    },
    options?: GenerateOptions
  ): Promise<ImageGenerateResult> {
    // Use gemini-3-pro-image-preview for image editing
    const model = options?.model || 'gemini-3-pro-image-preview';
    const config = this.buildConfig(options);

    try {
      const response = await genAI.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: imageData.data,
                  mimeType: imageData.mimeType,
                },
              },
            ],
          },
        ],
        config,
      });

      const candidate = response.candidates?.[0];
      const text = response.text || '';

      // Extract edited image data from response
      const images: Array<{ data: string; mimeType: 'image/png' | 'image/jpeg' | 'image/webp' }> =
        [];

      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            images.push({
              data: part.inlineData.data,
              mimeType: part.inlineData.mimeType as 'image/png' | 'image/jpeg' | 'image/webp',
            });
          }
        }
      }

      logger.debug('Gemini editImage success', { model });

      return {
        images,
        text,
        finishReason: candidate?.finishReason as string | undefined,
        usageMetadata: response.usageMetadata
          ? {
              promptTokenCount: response.usageMetadata.promptTokenCount || 0,
              candidatesTokenCount: response.usageMetadata.candidatesTokenCount || 0,
              totalTokenCount: response.usageMetadata.totalTokenCount || 0,
            }
          : undefined,
      };
    } catch (error) {
      logger.error('Gemini editImage failed', error);
      throw error;
    }
  }
}

// =============================================================================
// CHAT SESSION CLASS
// =============================================================================

export class GeminiChat {
  private chat: Chat;

  constructor(chat: Chat) {
    this.chat = chat;
  }

  /**
   * Send a message and get a response
   */
  async send(message: string): Promise<GenerateResult> {
    try {
      const response = await this.chat.sendMessage({ message });
      const candidate = response.candidates?.[0];
      const text = response.text || '';

      logger.debug('GeminiChat send success');

      return {
        text,
        finishReason: candidate?.finishReason as string | undefined,
        safetyRatings: candidate?.safetyRatings?.map((r) => ({
          category: r.category as string,
          probability: r.probability as string,
        })),
        usageMetadata: response.usageMetadata
          ? {
              promptTokenCount: response.usageMetadata.promptTokenCount || 0,
              candidatesTokenCount: response.usageMetadata.candidatesTokenCount || 0,
              totalTokenCount: response.usageMetadata.totalTokenCount || 0,
            }
          : undefined,
      };
    } catch (error) {
      logger.error('GeminiChat send failed', error);
      throw error;
    }
  }

  /**
   * Send a message with streaming response
   */
  async *sendStream(message: string): AsyncGenerator<StreamChunk> {
    try {
      const response = await this.chat.sendMessageStream({ message });

      for await (const chunk of response) {
        const text = chunk.text || '';
        yield {
          text,
          isComplete: false,
        };
      }

      yield {
        text: '',
        isComplete: true,
      };

      logger.debug('GeminiChat stream complete');
    } catch (error) {
      logger.error('GeminiChat sendStream failed', error);
      throw error;
    }
  }

  /**
   * Get chat history
   */
  getHistory(): ChatMessage[] {
    const history = this.chat.getHistory();
    return (history || []).map((content: Content) => ({
      role: content.role as 'user' | 'model',
      content: (content.parts || []).map((p: { text?: string }) => p.text || '').join(''),
    }));
  }
}

// =============================================================================
// DEFAULT INSTANCE & FACTORY
// =============================================================================

// Default instance with gemini-3-flash-preview model (latest recommended)
export const gemini = new Gemini();

/**
 * Create a Gemini instance with custom configuration
 *
 * @example
 * ```typescript
 * // Use latest model with custom settings
 * const ai = createGemini({
 *   model: 'gemini-3-flash-preview',
 *   config: { temperature: 0.7 },
 *   systemInstruction: 'You are a helpful assistant.',
 * });
 *
 * const result = await ai.generate('Hello!');
 *
 * // Generate images
 * const imageResult = await ai.generateImage('A beautiful sunset over mountains', {
 *   style: 'photographic',
 *   quality: 'high',
 *   aspectRatio: '16:9'
 * });
 * ```
 */
export const createGemini = (options?: {
  model?: GeminiModel;
  config?: GenerationConfig;
  safety?: SafetySettings;
  systemInstruction?: string;
}): Gemini => {
  return new Gemini(options);
};

export default gemini;
