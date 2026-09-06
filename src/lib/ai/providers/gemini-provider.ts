import { GoogleGenAI } from '@google/genai';
import { AIProvider, NormalizedAIRequest, NormalizedAIResponse, NormalizedToolCall } from './types';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini' as const;

  isConfigured(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return Boolean(key && !key.includes('your-gemini-api-key'));
  }

  async generateContent(request: NormalizedAIRequest): Promise<NormalizedAIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your-gemini-api-key')) {
      const err: any = new Error('Gemini API key not configured');
      err.status = 401;
      throw err;
    }

    const ai = new GoogleGenAI({ apiKey });

    const config: any = {};
    if (request.systemInstruction) {
      config.systemInstruction = request.systemInstruction;
    }
    if (request.tools && request.tools.length > 0) {
      config.tools = [{ functionDeclarations: request.tools }];
    }
    if (request.responseSchema) {
      config.responseMimeType = 'application/json';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: request.prompt,
      config,
    });

    const toolCalls: NormalizedToolCall[] = [];
    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const fc of response.functionCalls) {
        if (fc.name) {
          toolCalls.push({
            name: fc.name,
            arguments: (fc.args as Record<string, any>) || {},
          });
        }
      }
    }

    return {
      text: response.text || undefined,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      provider: this.name,
      raw: response,
    };
  }
}

export const geminiProvider = new GeminiProvider();
