import { OpenAICompatibleProvider } from './openai-compatible-provider';

export class GroqProvider extends OpenAICompatibleProvider {
  constructor() {
    const baseURL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    super('groq', baseURL, () => process.env.GROQ_API_KEY, model);
  }
}

export const groqProvider = new GroqProvider();
