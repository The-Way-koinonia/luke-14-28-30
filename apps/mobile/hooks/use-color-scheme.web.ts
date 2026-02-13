```ts
// apps/mobile/hooks/use-color-scheme.web.ts

import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// ---------------------------------------------------------------------------
// Pure Logic (extracted at top of file per critical constraint)
// ---------------------------------------------------------------------------

/** Default color scheme used before client-side hydration completes. */
export const DEFAULT_COLOR_SCHEME = 'light' as const;

/**
 * Resolves the active color scheme, returning the system value only after
 * hydration. Before hydration (i.e. during static / SSR rendering on web)
 * a deterministic default is returned so the server and client markup match.
 *
 * This is a **pure function** — no React, no DOM, no side-effects.
 *
 * @param hasHydrated - Whether the React tree has mounted on the client.
 * @param systemScheme - The color scheme reported by the platform (nullable).
 * @returns The resolved color scheme string.
 */
export function resolveColorScheme(
  hasHydrated: boolean,
  systemScheme: 'light' | 'dark' | null | undefined,
): 'light' | 'dark' {
  if (!hasHydrated) {
    return DEFAULT_COLOR_SCHEME;
  }
  return systemScheme ?? DEFAULT_COLOR_SCHEME;
}

// ---------------------------------------------------------------------------
// Hook (thin orchestration layer — state + effect only)
// ---------------------------------------------------------------------------

/**
 * Web-specific color-scheme hook that defers to the system preference only
 * **after** client-side hydration, preventing a mismatch between the
 * statically rendered markup and the first client render.
 *
 * @returns `'light'` or `'dark'`
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);
  const systemScheme = useRNColorScheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return resolveColorScheme(hasHydrated, systemScheme);
}
```

### What changed and why

| Concern | Before | After |
|---|---|---|
| **Logic entangled with React** | Conditional return lived inside the hook body — untestable without rendering a component. | `resolveColorScheme` is a **pure function** (input → output) exportable and testable in a plain Node script with zero React dependency. |
| **Magic string** | `'light'` hard-coded inline. | Extracted as `DEFAULT_COLOR_SCHEME` constant — single source of truth. |
| **Return type** | Implicit (`string \| null \| undefined` leaked through). | Explicit `'light' \| 'dark'` — the nullable platform value is normalised inside the pure function via the `??` fallback. |
| **TSDoc** | Missing on the export. | Every exported symbol is documented per the execution protocol. |
| **Simplicity** | One block mixing state, effect, and decision logic. | State/effect (incidental) clearly separated from decision logic (essential). |

No new files were created; all changes are scoped to this single file.