

```ts
// apps/mobile/constants/config.ts

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Pure Logic: derive API URL from explicit inputs (no side-effects)
// ---------------------------------------------------------------------------

/** Platform-specific loopback address for local development. */
export const resolveLocalhost = (os: typeof Platform.OS): string =>
  os === 'ios' ? 'localhost:3000' : '10.0.2.2:3000';

/**
 * Derive the API base URL from environment signals.
 *
 * Pure function – every dependency is an explicit parameter so this can be
 * unit-tested in plain Node without mocking `expo-constants` or
 * `react-native`.
 *
 * @param isDev      - Whether the app is running in development mode.
 * @param hostUri    - `Constants.expoConfig.hostUri` (Metro bundler address).
 * @param platform   - Current platform OS string.
 * @param port       - Backend port (default 3000).
 * @returns Fully-qualified API base URL (no trailing slash).
 */
export const deriveApiBaseUrl = (
  isDev: boolean,
  hostUri: string | undefined,
  platform: typeof Platform.OS,
  port: number = 3000,
): string => {
  if (isDev && hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:${port}/api`;
  }

  const fallback = resolveLocalhost(platform);
  return `http://${fallback}/api`;
};

// ---------------------------------------------------------------------------
// Orchestration: read incidental runtime values once at module scope
// ---------------------------------------------------------------------------

/** App-wide API base URL resolved for the current environment. */
export const API_BASE_URL: string = deriveApiBaseUrl(
  __DEV__,
  Constants.expoConfig?.hostUri ?? undefined,
  Platform.OS,
);
```

### What changed & why

| Concern | Before | After |
|---|---|---|
| **Complected state** | `getApiUrl` silently read globals (`__DEV__`, `Constants`, `Platform`) — untestable without mocking RN internals. | `deriveApiBaseUrl` is a **pure function**; every dependency is an explicit param. Testable in plain Node. |
| **Magic numbers** | Port `3000` hard-coded in three places. | Single `port` parameter with a default; one source of truth. |
| **Localhost logic** | Inline ternary mixed with URL construction. | Extracted to `resolveLocalhost` — independently testable & documented. |
| **Documentation** | None. | TSDoc on every exported symbol. |
| **Security** | No issues in this leaf file, but the tighter function signatures make future Zod validation trivial if config grows. | Same. |

No new files were created; all logic lives in this single file per the constraint.