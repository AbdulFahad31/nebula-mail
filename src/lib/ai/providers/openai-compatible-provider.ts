import { AIProvider, NormalizedAIRequest, NormalizedAIResponse, NormalizedToolCall } from './types';

export class OpenAICompatibleProvider implements AIProvider {
  readonly name: 'groq' | 'tokenrouter';
  private readonly baseURL: string;
  private readonly getApiKey: () => string | undefined;
  private readonly model: string;

  constructor(
    name: 'groq' | 'tokenrouter',
    baseURL: string,
    getApiKey: () => string | undefined,
    model: string
  ) {
    this.name = name;
    this.baseURL = baseURL.replace(/\/+$/, '');
    this.getApiKey = getApiKey;
    this.model = model;
  }

  isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && !key.includes('your-') && !key.includes('placeholder'));
  }

  async generateContent(request: NormalizedAIRequest): Promise<NormalizedAIResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey || apiKey.includes('your-') || apiKey.includes('placeholder')) {
      const err: any = new Error(`${this.name} API key not configured`);
      err.status = 401;
      throw err;
    }

    const messages: any[] = [];
    if (request.systemInstruction) {
      messages.push({ role: 'system', content: request.systemInstruction });
    }
    messages.push({ role: 'user', content: request.prompt });

    const payload: any = {
      model: this.model,
      messages,
      temperature: request.temperature ?? 0.2,
    };

    if (request.tools && request.tools.length > 0) {
      payload.tools = request.tools.map((t: any) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description || '',
          parameters: t.parameters || { type: 'object', properties: {} },
        },
      }));
      payload.tool_choice = 'auto';
    }

    if (request.responseSchema) {
      payload.response_format = { type: 'json_object' };
    }

    const endpoint = `${this.baseURL}/chat/completions`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs || 12000);

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      if (fetchErr.name === 'AbortError') {
        const timeoutError: any = new Error(`${this.name} request timed out after 12s`);
        timeoutError.status = 408;
        timeoutError.isTimeout = true;
        throw timeoutError;
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      const err: any = new Error(`${this.name} HTTP ${res.status}: ${errBody}`);
      err.status = res.status;
      err.rawBody = errBody;
      throw err;
    }

    const data = await res.json();
    const choice = data?.choices?.[0]?.message;

    const toolCalls: NormalizedToolCall[] = [];
    if (choice?.tool_calls && Array.isArray(choice.tool_calls)) {
      for (const tc of choice.tool_calls) {
        if (tc.function?.name) {
          let parsedArgs = {};
          if (typeof tc.function.arguments === 'string') {
            try {
              parsedArgs = JSON.parse(tc.function.arguments);
            } catch (e) {
              console.warn(`[${this.name}] Failed to parse tool arguments JSON`);
            }
          } else if (typeof tc.function.arguments === 'object') {
            parsedArgs = tc.function.arguments;
          }
          toolCalls.push({
            name: tc.function.name,
            arguments: parsedArgs,
          });
        }
      }
    }

    const text = choice?.content || undefined;

    return {
      text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      provider: this.name,
      raw: data,
    };
  }
}
