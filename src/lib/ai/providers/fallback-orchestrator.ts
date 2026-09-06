import { AIProvider, NormalizedAIRequest, NormalizedAIResponse } from './types';
import { geminiProvider } from './gemini-provider';
import { groqProvider } from './groq-provider';
import { tokenRouterProvider } from './token-router-provider';

export function classifyProviderError(err: any) {
  const status = err?.status || err?.code || err?.response?.status;
  const msg = String(err?.message || err || '');

  const isTimeout = Boolean(err?.isTimeout || err?.name === 'AbortError' || status === 408 || /timeout/i.test(msg));
  const isRateLimit = status === 429 || /429|RESOURCE_EXHAUSTED|rate\s*limit|quota|too\s*many\s*requests/i.test(msg);
  const isServerError = typeof status === 'number' && status >= 500 && status <= 599;
  const isNetworkFailure = /fetch failed|econnrefused|econnreset|network\s*error|enotfound/i.test(msg);

  const isAuthError = status === 401 || status === 403 || /unauthorized|forbidden|invalid\s*api\s*key|key\s*not\s*configured/i.test(msg);
  const isBadRequest = status === 400 || /bad\s*request|invalid\s*schema|malformed/i.test(msg);
  const isInsufficientCredit = /insufficient_quota|insufficient_credit|balance_exceeded|payment_required/i.test(msg);

  const isRetryable = (isTimeout || isRateLimit || isServerError || isNetworkFailure) && !isAuthError && !isBadRequest && !isInsufficientCredit;

  return {
    isRetryable,
    status,
    message: msg,
    isTimeout,
    isRateLimit,
    isAuthError,
    isBadRequest,
    isInsufficientCredit,
  };
}

export class FallbackOrchestrator {
  public providers: AIProvider[];

  constructor(providers?: AIProvider[]) {
    this.providers = providers || [geminiProvider, groqProvider, tokenRouterProvider];
  }

  async generateContent(request: NormalizedAIRequest): Promise<NormalizedAIResponse> {
    const attemptedLog: { provider: string; status: string; latencyMs: number; error?: string }[] = [];

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const isLastProvider = i === this.providers.length - 1;

      if (!provider.isConfigured()) {
        console.log(`[AI Fallback] Provider '${provider.name}' skipped (unconfigured / missing API key)`);
        attemptedLog.push({ provider: provider.name, status: 'SKIPPED_UNCONFIGURED', latencyMs: 0 });
        continue;
      }

      const attempts = isLastProvider ? 2 : 1;

      for (let attempt = 1; attempt <= attempts; attempt++) {
        const startTime = Date.now();
        try {
          console.log(`[AI Fallback] Attempting provider '${provider.name}' (attempt ${attempt}/${attempts})...`);
          
          const timeoutMs = request.timeoutMs || 12000;
          const result = await Promise.race([
            provider.generateContent(request),
            new Promise<never>((_, reject) => {
              setTimeout(() => {
                const tErr: any = new Error(`${provider.name} timed out after ${timeoutMs}ms`);
                tErr.isTimeout = true;
                tErr.status = 408;
                reject(tErr);
              }, timeoutMs);
            }),
          ]);

          const latencyMs = Date.now() - startTime;
          console.log(`[AI Fallback] SUCCESS from provider '${provider.name}' (${latencyMs}ms)`);
          attemptedLog.push({ provider: provider.name, status: 'SUCCESS', latencyMs });
          return result;
        } catch (err: any) {
          const latencyMs = Date.now() - startTime;
          const classification = classifyProviderError(err);

          console.warn(
            `[AI Fallback] Provider '${provider.name}' failed (attempt ${attempt}/${attempts}, ${latencyMs}ms):`,
            classification.message
          );

          attemptedLog.push({
            provider: provider.name,
            status: classification.isRetryable ? 'RETRYABLE_ERROR' : 'NON_RETRYABLE_ERROR',
            latencyMs,
            error: classification.message,
          });

          if (!classification.isRetryable) {
            // Non-retryable error on this provider (e.g. 401 auth failure, 400 bad request):
            // Stop retrying this provider and move to the next provider in the chain.
            break;
          }

          // If last provider and has another attempt left, retry once
          if (isLastProvider && attempt < attempts) {
            console.log(`[AI Fallback] Single retry on final provider '${provider.name}'...`);
            await new Promise((r) => setTimeout(r, 500));
            continue;
          }

          // Move to next provider in priority chain
          break;
        }
      }
    }

    const errorMsg = `All AI providers failed: ${attemptedLog.map((a) => `${a.provider} (${a.status})`).join(', ')}`;
    console.error(`[AI Fallback] FATAL: ${errorMsg}`);
    const fatalError: any = new Error(errorMsg);
    fatalError.attemptedProviders = attemptedLog;
    throw fatalError;
  }
}

export const fallbackOrchestrator = new FallbackOrchestrator();
