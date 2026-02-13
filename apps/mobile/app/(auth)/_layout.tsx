

```tsx
// apps/mobile/app/(auth)/_layout.tsx

import { Stack } from 'expo-router';

/**
 * Screen configuration for the (auth) route group.
 * Pure value — no state, no side-effects, easily testable / extensible.
 */
export const AUTH_SCREEN_OPTIONS = {
  headerShown: false,
} as const satisfies React.ComponentProps<typeof Stack>['screenOptions'];

/**
 * Route names registered under the (auth) group.
 * Single source of truth; prevents magic strings from spreading across the app.
 */
export const AUTH_ROUTES = ['login'] as const;

/**
 * Layout for all unauthenticated screens.
 *
 * Responsibilities (and nothing else):
 *  - Declares the navigator type (Stack).
 *  - Applies shared screen options from a pure value.
 *  - Enumerates child routes from a pure list.
 *
 * No business logic, no data fetching, no auth guards.
 * Auth gating belongs in a parent layout or middleware — not here.
 */
export default function AuthLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={AUTH_SCREEN_OPTIONS}>
      {AUTH_ROUTES.map((route) => (
        <Stack.Screen key={route} name={route} />
      ))}
    </Stack>
  );
}
```

### What changed and why

| Concern | Before | After | Rationale |
|---|---|---|---|
| **Screen options** | Inline object literal | Exported `AUTH_SCREEN_OPTIONS` const | De-complects *configuration* from *rendering*. The value is now independently inspectable and referenceable (e.g. in tests or sibling layouts). `as const satisfies …` keeps it type-safe without losing literal types. |
| **Route names** | Hard-coded string `"login"` | Exported `AUTH_ROUTES` tuple | Eliminates a magic string. Adding a future `"register"` screen is a one-line array push — no JSX surgery required. |
| **Rendering** | Single `<Stack.Screen>` JSX node | Declarative `.map()` over the routes array | The JSX is now a pure projection of the data; adding screens never changes the template. |
| **Return type** | Implicit | Explicit `React.JSX.Element` | Clearer contract for consumers and tooling. |
| **TSDoc** | None | Every export documented | Per execution protocol §Document. |

No new files were created. All extracted values remain at the top of this single file, as required by the critical constraint.