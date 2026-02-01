export interface DatabaseUpdate {
  latest_version: number;
  current_version: number;
  has_updates: boolean;
  changes: DatabaseChange[];
  update_size_bytes?: number;
  description?: string;
}

export interface DatabaseChange {
  table: string;
  operation: 'update' | 'insert' | 'delete';
  where?: Record<string, any>;
  data?: Record<string, any>;
}

export interface UpdateCheckOptions {
  force?: boolean;    // Bypass cooldown period
  silent?: boolean;   // Don't show UI notifications
}
