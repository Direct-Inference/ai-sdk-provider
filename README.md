# @directinference/ai-sdk

The official [Vercel AI SDK](https://ai-sdk.dev) provider for **DirectInference
(DI)** — the single endpoint that handles everything frontier models can, with
no model to pick. Drop it in with one key and one base URL: every call routes
through DI's hidden, always-current model selection and is served as the id you
send (echoed back). Pick a point on the cost↔performance dial by model id —
**`di-saver`**, **`di`** (the default — start here), or **`di-max`** — and DI
serves the right model and bills a flat per-id rate. Streaming token usage is on
by default. Works everywhere the AI SDK does (`generateText`, `streamText`, tool
calls, structured output).

> Status: pre-release scaffold tracking the ratified DI catalog/pricing program
> (PR #184, `docs/proposals/directinference-decisions-of-record.md`). The three
> ids and the effort-override semantics are settled; published prices are DRAFT.
> This package is the **developer-integration** path — it does not by itself get
> DI listed in a catalog (that needs platform provider onboarding).

## Install

```bash
npm i @directinference/ai-sdk ai
```

Set your DI API key (an `llm_live_*` credential):

```bash
export DIRECTINFERENCE_API_KEY=llm_live_...
```

## Quick start

```ts
import { generateText, streamText } from 'ai';
import { createDirectInference } from '@directinference/ai-sdk';

const di = createDirectInference({
  apiKey: process.env.DIRECTINFERENCE_API_KEY, // llm_live_...
  // baseURL defaults to https://api.directinference.com/di/v1
  // includeUsage defaults to true (streaming token usage is defined)
});

// The default — `di` serves the best model per request at a flat rate.
const { text, usage } = await generateText({
  model: di('di'),
  prompt: 'Summarize the CAP theorem in two sentences.',
});
console.log(text, usage);

// di-saver — lowest cost, for high-volume / latency-sensitive / simple work.
const cheap = await generateText({
  model: di('di-saver'),
  prompt: 'Tag this ticket as bug/feature/question: "App crashes on launch."',
});

// di-max — maximum capability; streaming usage arrives by default.
const stream = streamText({
  model: di('di-max'),
  prompt: 'Write a haiku about hidden routing.',
});
for await (const delta of stream.textStream) process.stdout.write(delta);
console.log('\nusage:', await stream.usage);
```

## The three ids

`di-saver` / `di` / `di-max` are three points on **one** cost↔performance dial,
not three models. DI resolves each to an effort grade and serves the right model
per request:

- **`di-saver`** — the cheapest model that fully handles the request. A request
  that genuinely needs more (heavy reasoning, long context, big PDF) is served
  and billed at the `di` grade for that request, disclosed via the
  `X-DI-Billed-Tier` response header — it never fails.
- **`di`** (default) — best intelligence-per-dollar per request. If you're
  unsure, use this one.
- **`di-max`** — maximum capability with retries/repair, for the hardest work.

## Optional effort override

`di` already chooses effort per request. To bias a fixed grade up or down, set
`effort` (sent as the `X-DI-Effort` header). It changes routing **quality only**
— the bill stays the called id's flat rate, clamped to that id's budget
server-side (so `di-saver` with `effort: 'max'` can't buy frontier compute at
the saver price):

```ts
const careful = createDirectInference({
  apiKey: process.env.DIRECTINFERENCE_API_KEY,
  effort: 'high', // X-DI-Effort on every call; per-call: make a second instance
});
await generateText({ model: careful('di'), prompt: 'Plan a 3-step migration.' });
```

`effort` accepts `fast | minimal | low | medium | high | xhigh | max`; omit it
(or `auto`) to let DI choose.

## Accept-any-id

DI accepts any model id and echoes it back, so the model-id type ends in
`(string & {})` — arbitrary strings type-check and pass through unchanged. For
clean cost attribution in downstream tools, prefer `di`/`di-saver`/`di-max` over
echoing a frontier id like `gpt-4o` (a real id makes cost trackers apply that
model's public price to a DI call).

## Configuration

| Option | Default | Notes |
| :-- | :-- | :-- |
| `apiKey` | `process.env.DIRECTINFERENCE_API_KEY` | Sent as `Authorization: Bearer <apiKey>`. |
| `baseURL` | `https://api.directinference.com/di/v1` | DI's OpenAI-compatible surface. |
| `effort` | – | Optional `X-DI-Effort` override; quality-only, billed at the id's flat rate. |
| `includeUsage` | `true` | Requests `stream_options:{include_usage:true}` so streamed usage is defined. |
| `headers` | – | Extra headers; win over auth/effort on key collision. |
| `fetch` | global `fetch` | Custom fetch, e.g. to read the `X-DI-Request-Type` response header. |

## Compatibility

Built on `@ai-sdk/openai-compatible`, pinned to the `ai` v6 / LanguageModelV3
stable line. When DI moves to `ai` v7 / LanguageModelV4, the only change is two
dependency pins — the wrapper code is spec-version agnostic.

## License

Apache-2.0
