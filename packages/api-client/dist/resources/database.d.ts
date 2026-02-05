import { ApiClient } from '../client';
import { DatabaseUpdate } from '@the-way/types';
export declare class DatabaseResource {
    private client;
    constructor(client: ApiClient);
    checkForUpdates(currentVersion: number): Promise<DatabaseUpdate>;
}
