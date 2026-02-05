import { SocialResource } from './resources/social';
import { DatabaseResource } from './resources/database';

export interface ApiClientConfig {
  baseUrl: string;
  authToken?: string;
}

export class ApiClient {
  private config: ApiClientConfig;
  public readonly social: SocialResource;
  public readonly database: DatabaseResource;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.social = new SocialResource(this);
    this.database = new DatabaseResource(this);
  }

  setAuthToken(token: string) {
    this.config.authToken = token;
  }

  public async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
        // Try to parse error message
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
            const errorJson = await response.json();
            if (errorJson.message) errorMessage = errorJson.message;
        } catch {}
        throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }
}

