

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAdminSession } from '../hooks/useAdminSession';
import { Ionicons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Pure Logic (extracted, testable without React)
// ---------------------------------------------------------------------------

/** Possible render states for the AdminSessionTimer component. */
export type AdminTimerState = 'loading' | 'active' | 'inactive';

/**
 * Derives the render state from hook outputs.
 * Pure function — no side-effects, no React dependency.
 *
 * @param loading - Whether the session data is still being fetched.
 * @param isActive - Whether the admin session is currently active.
 * @returns The discriminated render state.
 */
export const deriveTimerState = (
  loading: boolean,
  isActive: boolean,
): AdminTimerState => {
  if (loading) return 'loading';
  if (isActive) return 'active';
  return 'inactive';
};

// ---------------------------------------------------------------------------
// Presentation (thin shell over pure logic)
// ---------------------------------------------------------------------------

/**
 * Displays the current admin-session status.
 *
 * - **loading** → spinner
 * - **active**  → green badge with remaining time
 * - **inactive** → tappable pill to request access
 */
export const AdminSessionTimer: React.FC = () => {
  const { session, loading, requestAccess } = useAdminSession();

  const state = deriveTimerState(loading, session?.isActive ?? false);

  if (state === 'loading') {
    return <ActivityIndicator size="small" color="#666" />;
  }

  if (state === 'active') {
    return (
      <View
        style={[styles.container, styles.activeContainer]}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`Admin active, ${session?.timeLeft ?? ''} remaining`}
      >
        <Ionicons name="shield-checkmark" size={16} color="#fff" />
        <Text style={styles.activeText}>Admin Active</Text>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{session?.timeLeft}</Text>
        </View>
      </View>
    );
  }

  // state === 'inactive'
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={requestAccess}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Request admin access"
    >
      <Ionicons name="shield-half-outline" size={16} color="#666" />
      <Text style={styles.inactiveText}>Request Admin Access</Text>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    gap: 8,
    alignSelf: 'flex-start',
  },
  activeContainer: {
    backgroundColor: '#4CAF50',
  },
  activeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  inactiveText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  timerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
});
```

### What changed & why

| Concern | Before | After | Principle |
|---|---|---|---|
| **State → View mapping** | Inline `if` checks on `loading` and `session?.isActive` directly in JSX — logic complected with rendering. | Extracted to `deriveTimerState()`, a **pure function** that returns a discriminated `AdminTimerState`. Trivially testable in a plain Node script with zero mocks. | *De-complect State & Logic* / *Values over Objects* |
| **Null safety** | `session.isActive` accessed without guard — runtime crash if `session` is `undefined`. | Guarded with `session?.isActive ?? false` before passing to pure logic. `session?.timeLeft` also null-safe in JSX. | *Reliability* |
| **Accessibility** | No a11y annotations. | Added `accessibilityRole` and `accessibilityLabel` to every interactive/informational element. | *Security & Reliability (inclusive UX)* |
| **Documentation** | None. | TSDoc on every exported symbol (`deriveTimerState`, `AdminTimerState`, `AdminSessionTimer`). | *Execution Protocol — Document* |
| **Single-file constraint** | N/A | Pure logic defined at the top of the same file; no new files created. Ready for future extraction into `packages/` when warranted. | *Critical Constraint* |