import { OpenAICompatibleChatLanguageModel } from '@ai-sdk/openai-compatible';
import {
  loadApiKey,
  withoutTrailingSlash,
  type FetchFunction,
} from '@ai-sdk/provider-utils';
import type { LanguageModelV3 } from '@ai-sdk/provider';
import type {
  DirectInferenceChatModelId,
  DirectInferenceProviderSettings,
} from './directinference-chat-settings';

const DEFAULT_BASE_URL = 'https://api.directinference.com/di/v1';

export interface DirectInferenceProvider {
  (modelId: DirectInferenceChatModelId): LanguageModelV3;
  languageModel(modelId: DirectInferenceChatModelId): LanguageModelV3;
  chat(modelId: DirectInferenceChatModelId): LanguageModelV3;
}

/**
 * Build the request headers for a DI call: Bearer auth, an optional
 * `X-DI-Effort` override, then any caller-supplied headers (which win).
 * Exported for unit testing; not part of the package's public surface.
 */
export function diHeaders(
  options: DirectInferenceProviderSettings,
): Record<string, string> {
  const apiKey = loadApiKey({
    apiKey: options.apiKey,
    environmentVariableName: 'DIRECTINFERENCE_API_KEY',
    description: 'DirectInference',
  });
  return {
    Authorization: `Bearer ${apiKey}`,
    ...(options.effort && options.effort !== 'auto'
      ? { 'X-DI-Effort': options.effort }
      : {}),
    ...options.headers,
  };
}

/**
 * Create a DirectInference provider for the Vercel AI SDK.
 *
 * One endpoint, one key, one base URL. Pick a grade of service by model id —
 * `di` (default, "start here"), `di-saver`, or `di-max`; DI resolves each to an
 * effort pin and bills a flat per-id rate, with the served model hidden and the
 * id echoed back. Streaming token usage is on by default.
 */
export function createDirectInference(
  options: DirectInferenceProviderSettings = {},
): DirectInferenceProvider {
  const baseURL = withoutTrailingSlash(options.baseURL) ?? DEFAULT_BASE_URL;

  // includeUsage defaults to true so streaming requests carry
  // stream_options:{include_usage:true} and streamed token usage is defined.
  const includeUsage = options.includeUsage ?? true;

  const createChatModel = (
    modelId: DirectInferenceChatModelId,
  ): LanguageModelV3 =>
    // The model id is sent verbatim — `di`/`di-saver`/`di-max` are first-class
    // ids DI resolves itself; arbitrary ids pass through (accept-any-id).
    new OpenAICompatibleChatLanguageModel(modelId, {
      provider: 'directinference.chat',
      url: ({ path }) => `${baseURL}${path}`,
      headers: () => diHeaders(options),
      fetch: options.fetch as FetchFunction | undefined,
      includeUsage,
    });

  const provider = ((modelId: DirectInferenceChatModelId) =>
    createChatModel(modelId)) as DirectInferenceProvider;

  provider.languageModel = createChatModel;
  provider.chat = createChatModel;

  return provider;
}

/**
 * Default DirectInference provider instance.
 * Reads the key from `DIRECTINFERENCE_API_KEY`. Streaming usage is on.
 */
export const directinference = createDirectInference();
