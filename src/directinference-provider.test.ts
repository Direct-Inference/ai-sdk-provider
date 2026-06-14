import { describe, it, expect } from 'vitest';
import { createDirectInference, diHeaders } from './directinference-provider';

describe('createDirectInference', () => {
  it('passes the three SKU ids through verbatim', () => {
    const di = createDirectInference({ apiKey: 'llm_live_test' });
    expect(di('di').modelId).toBe('di');
    expect(di('di-saver').modelId).toBe('di-saver');
    expect(di('di-max').modelId).toBe('di-max');
  });

  it('passes arbitrary ids through unchanged (accept-any-id)', () => {
    const di = createDirectInference({ apiKey: 'llm_live_test' });
    expect(di('gpt-4o').modelId).toBe('gpt-4o');
    expect(di('di-fast').modelId).toBe('di-fast'); // hidden server-side alias
  });
});

describe('diHeaders', () => {
  it('sets Bearer auth from the apiKey', () => {
    expect(diHeaders({ apiKey: 'llm_live_test' }).Authorization).toBe(
      'Bearer llm_live_test',
    );
  });

  it('sends X-DI-Effort when an effort override is set', () => {
    expect(diHeaders({ apiKey: 'k', effort: 'high' })['X-DI-Effort']).toBe(
      'high',
    );
  });

  it('omits X-DI-Effort by default and for auto', () => {
    expect(diHeaders({ apiKey: 'k' })['X-DI-Effort']).toBeUndefined();
    expect(
      diHeaders({ apiKey: 'k', effort: 'auto' })['X-DI-Effort'],
    ).toBeUndefined();
  });

  it('lets caller headers override on key collision', () => {
    const h = diHeaders({
      apiKey: 'k',
      effort: 'fast',
      headers: { 'X-DI-Effort': 'max' },
    });
    expect(h['X-DI-Effort']).toBe('max');
  });
});
