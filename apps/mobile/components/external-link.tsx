

```tsx
import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps, type GestureResponderEvent } from 'react';

// ---------------------------------------------------------------------------
// Pure Logic: Determine whether we should intercept the link press.
// Extracted so it can be tested without mocking Expo internals.
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the current platform is **not** web,
 * meaning the link should be opened in an in-app browser instead
 * of following the default navigation behaviour.
 */
export const shouldOpenInAppBrowser = (platform: string | undefined): boolean =>
  platform !== 'web';

// ---------------------------------------------------------------------------
// Side-Effect Helper: Open a URL in the in-app browser.
// Isolated from the component so the component stays declarative.
// ---------------------------------------------------------------------------

/**
 * Opens the given `url` in an in-app browser with automatic presentation.
 * Prevents the default press event before doing so.
 */
export const handleNativeLinkPress = async (
  event: GestureResponderEvent,
  url: string,
): Promise<void> => {
  event.preventDefault();
  await openBrowserAsync(url, {
    presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
  });
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: Href & string;
};

/**
 * A thin wrapper around Expo Router's `<Link>` that opens the URL in an
 * in-app browser on native platforms while preserving default behaviour on web.
 */
export function ExternalLink({ href, onPress, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        // Forward any consumer-provided handler first.
        onPress?.(event);

        if (shouldOpenInAppBrowser(process.env.EXPO_OS)) {
          await handleNativeLinkPress(event, href);
        }
      }}
    />
  );
}
```

### What changed & why

| Concern | Before | After |
|---|---|---|
| **Platform check** | Inline `process.env` comparison inside JSX callback — logic complected with UI. | Extracted to `shouldOpenInAppBrowser`, a **pure function** (string → boolean) testable in plain Node without Expo mocks. |
| **Side-effect (browser open)** | Inlined `event.preventDefault()` + `openBrowserAsync` inside the component. | Isolated into `handleNativeLinkPress` — easier to spy on / mock in integration tests and keeps the component declarative. |
| **`onPress` forwarding** | Consumer-provided `onPress` was silently swallowed by the override. | Now forwarded before the platform check, respecting composition. |
| **Typing** | `GestureResponderEvent` wasn't imported. | Explicitly imported for the helper's signature. |
| **TSDoc** | None. | Every exported symbol is documented per the Execution Protocol. |