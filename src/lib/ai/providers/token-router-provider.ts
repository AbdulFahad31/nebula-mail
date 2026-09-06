import { OpenAICompatibleProvider } from './openai-compatible-provider';

export class TokenRouterProvider extends OpenAICompatibleProvider {
  constructor() {
    const baseURL = process.env.TOKEN_ROUTER_BASE_URL || 'https://api.tokenrouter.com/v1';
    const model = process.env.TOKEN_ROUTER_MODEL || 'openai/gpt-4o-mini';
    super('tokenrouter', baseURL, () => process.env.TOKEN_ROUTER_API_KEY, model);
  }
}

export const tokenRouterProvider = new TokenRouterProvider();
