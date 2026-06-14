// The three customer-facing DI model ids — three points on one cost↔performance
// dial, NOT three separate models. DI resolves each to an effort pin
// server-side and bills a flat per-id rate:
//   di-saver -> cheapest model that clears the task        (lean cost)
//   di       -> best intelligence-per-dollar per request   (the default — start here)
//   di-max   -> maximum capability + retries/repair         (premium opt-in)
// Ratified in PR #184 (docs/proposals/directinference-decisions-of-record.md).
export type DirectInferenceModelId = 'di' | 'di-saver' | 'di-max';

// Free union: the three ids + any string. The `(string & {})` tail keeps DI's
// accept-any-id behavior intact — arbitrary ids type-check and are echoed back
// by DI verbatim, while the literals drive editor autocomplete. (The retired
// `di-fast` id still resolves server-side as a hidden alias of `di-saver`.)
export type DirectInferenceChatModelId = DirectInferenceModelId | (string & {});

// Optional per-request effort OVERRIDE on DI's own API. It changes routing
// budget/quality, never the SKU's flat billed rate, and is clamped to the
// SKU's budget ceiling server-side (e.g. `di-saver` + `max` cannot buy frontier
// compute at the saver price). `auto` (the default) sends no header.
export type DirectInferenceEffort =
  | 'auto'
  | 'fast'
  | 'minimal'
  | 'low'
  | 'medium'
  | 'high'
  | 'xhigh'
  | 'max';

export interface DirectInferenceProviderSettings {
  /**
   * DI API base URL.
   * @default 'https://api.directinference.com/di/v1'
   */
  baseURL?: string;
  /**
   * DI API key (`llm_live_*`). Sent as `Authorization: Bearer <apiKey>`.
   * Falls back to `process.env.DIRECTINFERENCE_API_KEY`.
   */
  apiKey?: string;
  /**
   * Optional effort override, sent as `X-DI-Effort` on every call. Changes
   * routing quality only — the bill stays the called SKU's flat rate, clamped
   * to that SKU's budget server-side. Omit (or `auto`) to let DI choose.
   */
  effort?: DirectInferenceEffort;
  /** Extra headers added after auth + effort (these win on key collisions). */
  headers?: Record<string, string>;
  /** Custom fetch — e.g. to read back the `X-DI-Request-Type` response header. */
  fetch?: typeof globalThis.fetch;
  /**
   * Request streaming token usage. Defaults to `true` so
   * `stream_options:{include_usage:true}` is emitted and streamed usage is
   * defined. Set `false` only if you have a reason to drop streaming usage.
   * @default true
   */
  includeUsage?: boolean;
}
