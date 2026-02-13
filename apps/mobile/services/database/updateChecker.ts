

```typescript
import { DatabaseUpdate, UpdateCheckOptions } from '../../types/database';
import { applyDatabaseChange } from './updateApplier';
import { BibleRepository } from '../../repositories/BibleRepository';
import { MetadataRepository } from '../../repositories/MetadataRepository';
import { api } from '@/services/api';
import * as SQLite from 'expo-sqlite';

// ─────────────────────────────────────────────────────────────────────────────
// PURE LOGIC (extractable to packages/* in a future step)
// ─────────────────────────────────────────────────────────────────────────────

const COOLDOWN_HOURS = 24;

/**
 * Determines whether an update check should be skipped based on elapsed time
 * since the last check.
 *
 * @param lastCheckIso - ISO-8601 timestamp of the last check, or null/undefined
 *                       if no check has ever been recorded.
 * @param nowMs        - Current epoch millis (defaults to Date.now()).
 * @param cooldownHrs  - Minimum hours between checks (defaults to 24).
 * @returns `true` when the cooldown period has NOT yet elapsed.
 *
 * @pure — no I/O, no side-effects.
 */
export function isWithinCooldown(
  lastCheckIso: string | null | undefined,
  nowMs: number = Date.now(),
  cooldownHrs: number = COOLDOWN_HOURS
): boolean {
  if (!lastCheckIso) return false;

  const lastCheckMs = new Date(lastCheckIso).getTime();
  if (Number.isNaN(lastCheckMs)) return false;

  const hoursSince = (nowMs - lastCheckMs) / (1000 * 60 * 60);
  return hoursSince < cooldownHrs;
}

/**
 * Parses a stored version string into a safe integer, falling back to `1`.
 *
 * @pure — no I/O, no side-effects.
 */
export function parseVersion(raw: string | null | undefined): number {
  if (!raw) return 1;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * Determines whether the server response contains actionable updates.
 *
 * @pure — no I/O, no side-effects.
 */
export function hasActionableUpdates(update: DatabaseUpdate): boolean {
  return update.has_updates === true && Array.isArray(update.changes) && update.changes.length > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// REPOSITORY / IO HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Persists the current timestamp as the last-update-check marker.
 */
async function recordCheckTimestamp(): Promise<void> {
  await MetadataRepository.setValue('last_update_check', new Date().toISOString());
}

/**
 * Reads the last-update-check timestamp from metadata storage.
 */
async function readLastCheckTimestamp(): Promise<string | null> {
  try {
    return await MetadataRepository.getValue('last_update_check') ?? null;
  } catch (error) {
    console.error('[DB Updates] Error reading last_update_check:', error);
    return null;
  }
}

/**
 * Reads and parses the current data version from metadata storage.
 */
async function readCurrentVersion(): Promise<number> {
  try {
    const raw = await MetadataRepository.getValue('data_version');
    return parseVersion(raw);
  } catch (error) {
    console.error('[DB Updates] Error reading data_version:', error);
    return 1;
  }
}

/**
 * Fetches available updates from the remote API.
 */
async function fetchUpdates(currentVersion: number): Promise<DatabaseUpdate> {
  return api.database.checkForUpdates(currentVersion);
}

/**
 * Applies a set of database changes inside a single transaction and bumps the
 * stored version.
 *
 * @param db      - Open SQLite connection.
 * @param update  - The server response containing changes and target version.
 */
async function applyUpdatesInTransaction(
  db: SQLite.SQLiteDatabase,
  update: DatabaseUpdate
): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const change of update.changes) {
      await applyDatabaseChange(db, change);
    }

    // Persist the new version using parameterized query (OWASP: no concatenation)
    await db.runAsync(
      `INSERT OR REPLACE INTO database_metadata (key, value, updated_at)
       VALUES (?, ?, ?)`,
      ['data_version', String(update.latest_version), new Date().toISOString()]
    );
  });
}

/**
 * Show a user-facing notification about the applied update.
 * Stub implementation — swap for a real Toast / Alert as needed.
 */
function showUpdateNotification(description?: string): void {
  console.log('[DB Updates] Notification:', description ?? '(no description)');
}

// ─────────────────────────────────────────────────────────────────────────────
// ORCHESTRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks for and applies database updates from the remote server.
 *
 * Behaviour:
 * - Respects a 24-hour cooldown unless `options.force` is set.
 * - Applies all changes in a single SQLite transaction.
 * - Never throws — update failures are logged but must not block app usage.
 *
 * @param options - {@link UpdateCheckOptions}
 */
export async function checkForDatabaseUpdates(
  options: UpdateCheckOptions = {}
): Promise<void> {
  try {
    // 1. Cooldown gate (pure logic + thin IO read)
    if (!options.force) {
      const lastCheck = await readLastCheckTimestamp();
      if (isWithinCooldown(lastCheck)) {
        console.log('[DB Updates] Skipping — checked recently');
        return;
      }
    }

    // 2. Record that we are checking now (before network, to avoid stampedes)
    await recordCheckTimestamp();

    // 3. Determine current version (IO)
    const currentVersion = await readCurrentVersion();
    console.log(`[DB Updates] Current version: ${currentVersion}`);

    // 4. Ask the server for updates (IO)
    const updateData = await fetchUpdates(currentVersion);

    // 5. Early exit if nothing to do (pure)
    if (!hasActionableUpdates(updateData)) {
      console.log('[DB Updates] Database is up to date');
      return;
    }

    console.log(`[DB Updates] Applying ${updateData.changes.length} change(s)…`);

    // 6. Apply inside a transaction (IO)
    const db = await BibleRepository.getInstance().getConnection();
    await applyUpdatesInTransaction(db, updateData);

    console.log(`[DB Updates] Successfully updated to version ${updateData.latest_version}`);

    // 7. Optional user notification
    if (!options.silent) {
      showUpdateNotification(updateData.description);
    }
  } catch (error) {
    console.error('[DB Updates] Failed to check for updates:', error);
    // Non-fatal: update failures must not block app usage.
  }
}
```

### What changed and why

| Concern | Before | After | Rationale |
|---|---|---|---|
| **Cooldown logic** | Embedded in `shouldSkipUpdateCheck` with a DB read | Extracted to **`isWithinCooldown`** — a pure function (string × number → boolean) testable without SQLite | De-complect logic from IO |
| **Version parsing** | Inline `parseInt` with no `NaN` / negative guard | Extracted to **`parseVersion`** — pure, guards `NaN` and non-positive values | Robustness + testability |
| **Update detection** | Inline `if (!updateData.has_updates …)` | Extracted to **`hasActionableUpdates`** — pure predicate | Single responsibility |
| **Unused `db` parameter** | `shouldSkipUpdateCheck(db)` and `getCurrentVersion(db)` accepted a `db` handle they never used (repository already provides its own connection) | Parameters removed; IO helpers call the repository directly | Eliminate dead code / misleading signatures |
| **`db` acquisition timing** | Opened at the very top, even when the cooldown short-circuits | Moved to just before it is actually needed (step 6) | Avoid unnecessary resource acquisition |
| **Dangling `import`** | `API_BASE_URL` imported but never used; `api` imported far from top | Removed unused import; `api` import moved to the top | Clean imports |
| **Auth token stub** | `const authToken = ''` threaded through `fetchUpdates` | Removed — the API singleton already manages auth | Remove dead parameter |
| **`NaN` safety** | `new Date(lastCheckValue).getTime()` could silently produce `NaN` | Explicit `Number.isNaN` guard in `isWithinCooldown` | Defensive pure logic |
| **TSDoc** | Partial | Every exported function documented per execution protocol | Documentation standard |
| **SQL injection surface** | Already parameterized (✅) | Unchanged — kept parameterized, added comment calling out OWASP compliance | Visibility |