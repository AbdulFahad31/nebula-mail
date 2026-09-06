import { describe, it, expect, vi } from 'vitest';
import { FallbackOrchestrator, classifyProviderError } from '@/lib/ai/providers/fallback-orchestrator';
import { AIProvider, NormalizedAIRequest, NormalizedAIResponse } from '@/lib/ai/providers/types';

describe('Multi-Provider AI Fallback Chain (Gemini -> Groq -> TokenRouter)', () => {
  const sampleRequest: NormalizedAIRequest = {
    prompt: 'Summarize recent emails',
    systemInstruction: 'You are an AI assistant',
  };

  function createMockProvider(
    name: 'gemini' | 'groq' | 'tokenrouter',
    configured = true,
    handler?: (req: NormalizedAIRequest) => Promise<NormalizedAIResponse>
  ): AIProvider {
    return {
      name,
      isConfigured: () => configured,
      generateContent: handler || (async () => ({
        text: `Response from ${name}`,
        provider: name,
      })),
    };
  }

  it('1. Gemini succeeds normally -> response comes from Gemini, no fallback triggered', async () => {
    const gemini = createMockProvider('gemini', true, async () => ({ text: 'Gemini Brief', provider: 'gemini' }));
    const groq = createMockProvider('groq', true, async () => ({ text: 'Groq Brief', provider: 'groq' }));
    const tokenRouter = createMockProvider('tokenrouter', true, async () => ({ text: 'TokenRouter Brief', provider: 'tokenrouter' }));

    const orchestrator = new FallbackOrchestrator([gemini, groq, tokenRouter]);
    const res = await orchestrator.generateContent(sampleRequest);

    expect(res.provider).toBe('gemini');
    expect(res.text).toBe('Gemini Brief');
  });

  it('2. Gemini returns 429 -> Groq is attempted and succeeds -> provider is groq', async () => {
    const gemini = createMockProvider('gemini', true, async () => {
      const err: any = new Error('RESOURCE_EXHAUSTED: Rate limit exceeded 429');
      err.status = 429;
      throw err;
    });
    const groq = createMockProvider('groq', true, async () => ({ text: 'Groq Response', provider: 'groq' }));
    const tokenRouter = createMockProvider('tokenrouter', true);

    const orchestrator = new FallbackOrchestrator([gemini, groq, tokenRouter]);
    const res = await orchestrator.generateContent(sampleRequest);

    expect(res.provider).toBe('groq');
    expect(res.text).toBe('Groq Response');
  });

  it('3. Gemini times out -> fallback to Groq triggers correctly', async () => {
    const gemini = createMockProvider('gemini', true, async () => {
      const err: any = new Error('Gemini request timed out after 10ms');
      err.status = 408;
      err.isTimeout = true;
      throw err;
    });
    const groq = createMockProvider('groq', true, async () => ({ text: 'Groq Timeout Fallback', provider: 'groq' }));

    const orchestrator = new FallbackOrchestrator([gemini, groq]);
    const res = await orchestrator.generateContent({ ...sampleRequest, timeoutMs: 50 });

    expect(res.provider).toBe('groq');
    expect(res.text).toBe('Groq Timeout Fallback');
  });

  it('4. Gemini returns 401 (bad API key) -> fallback to Groq engages correctly', async () => {
    const gemini = createMockProvider('gemini', true, async () => {
      const err: any = new Error('Invalid Gemini API key');
      err.status = 401;
      throw err;
    });
    const groq = createMockProvider('groq', true, async () => ({ text: 'Groq Response', provider: 'groq' }));

    const orchestrator = new FallbackOrchestrator([gemini, groq]);
    const res = await orchestrator.generateContent(sampleRequest);

    expect(res.provider).toBe('groq');
    expect(res.text).toBe('Groq Response');
  });

  it('5. Gemini and Groq both fail (retryable) -> TokenRouter is attempted and succeeds', async () => {
    const gemini = createMockProvider('gemini', true, async () => {
      const err: any = new Error('Gemini 503 Server Error');
      err.status = 503;
      throw err;
    });
    const groq = createMockProvider('groq', true, async () => {
      const err: any = new Error('Groq 429 Rate Limit Exceeded');
      err.status = 429;
      throw err;
    });
    const tokenRouter = createMockProvider('tokenrouter', true, async () => ({
      text: 'TokenRouter Tertiary Fallback Response',
      provider: 'tokenrouter',
    }));

    const orchestrator = new FallbackOrchestrator([gemini, groq, tokenRouter]);
    const res = await orchestrator.generateContent(sampleRequest);

    expect(res.provider).toBe('tokenrouter');
    expect(res.text).toBe('TokenRouter Tertiary Fallback Response');
  });

  it('6. All three providers fail -> orchestrator returns typed error detailing attempted providers', async () => {
    const gemini = createMockProvider('gemini', true, async () => {
      const err: any = new Error('Gemini 500');
      err.status = 500;
      throw err;
    });
    const groq = createMockProvider('groq', true, async () => {
      const err: any = new Error('Groq 502');
      err.status = 502;
      throw err;
    });
    const tokenRouter = createMockProvider('tokenrouter', true, async () => {
      const err: any = new Error('TokenRouter 503');
      err.status = 503;
      throw err;
    });

    const orchestrator = new FallbackOrchestrator([gemini, groq, tokenRouter]);

    await expect(orchestrator.generateContent(sampleRequest)).rejects.toThrow('All AI providers failed');
  });

  it('7. Error classification accurately categorizes retryable vs non-retryable errors', () => {
    expect(classifyProviderError({ status: 429, message: 'Quota exceeded' }).isRetryable).toBe(true);
    expect(classifyProviderError({ status: 503, message: 'Service unavailable' }).isRetryable).toBe(true);
    expect(classifyProviderError({ isTimeout: true, message: 'Timed out' }).isRetryable).toBe(true);

    expect(classifyProviderError({ status: 401, message: 'Unauthorized key' }).isRetryable).toBe(false);
    expect(classifyProviderError({ status: 400, message: 'Bad request invalid field' }).isRetryable).toBe(false);
    expect(classifyProviderError({ message: 'insufficient_credit' }).isRetryable).toBe(false);
  });
});
