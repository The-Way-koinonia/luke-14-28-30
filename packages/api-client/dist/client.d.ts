import { SocialResource } from './resources/social';
import { DatabaseResource } from './resources/database';
export interface ApiClientConfig {
    baseUrl: string;
    authToken?: string;
}
export declare class ApiClient {
    private config;
    readonly social: SocialResource;
    readonly database: DatabaseResource;
    constructor(config: ApiClientConfig);
    setAuthToken(token: string): void;
    fetch<T>(path: string, options?: RequestInit): Promise<T>;
}
