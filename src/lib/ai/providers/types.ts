export interface NormalizedToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface NormalizedAIRequest {
  prompt: string;
  systemInstruction?: string;
  tools?: any[];
  responseSchema?: any;
  temperature?: number;
  timeoutMs?: number;
}

export interface NormalizedAIResponse {
  text?: string;
  toolCalls?: NormalizedToolCall[];
  provider: 'gemini' | 'groq' | 'tokenrouter';
  raw?: unknown;
}

export interface AIProvider {
  name: 'gemini' | 'groq' | 'tokenrouter';
  isConfigured(): boolean;
  generateContent(request: NormalizedAIRequest): Promise<NormalizedAIResponse>;
}

export interface ProviderErrorClassification {
  isRetryable: boolean;
  status?: number;
  message: string;
  category: 'RATE_LIMIT' | 'SERVER_ERROR' | 'TIMEOUT' | 'AUTH_ERROR' | 'BAD_REQUEST' | 'CREDIT_EXHAUSTED' | 'UNKNOWN';
}
