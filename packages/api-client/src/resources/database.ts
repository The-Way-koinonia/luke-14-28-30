import { ApiClient } from '../client';
import { DatabaseUpdate } from '@the-way/types';

export class DatabaseResource {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async checkForUpdates(currentVersion: number): Promise<DatabaseUpdate> {
    return this.client.fetch<DatabaseUpdate>(`/database/updates?current_version=${currentVersion}`);
  }
}
