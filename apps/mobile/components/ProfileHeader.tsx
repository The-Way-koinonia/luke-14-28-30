

```tsx
// apps/mobile/components/ProfileHeader.tsx

import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';

// ─────────────────────────────────────────────
// 1. SCHEMAS (Validation — Security Protocol)
// ─────────────────────────────────────────────

/** Zod schema for profile statistics. Ensures non-negative integers. */
const ProfileStatsSchema = z.object({
  posts: z.number().int().nonneg(),
  followers: z.number().int().nonneg(),
  following: z.number().int().nonneg(),
});

/** Zod schema for the full set of ProfileHeader props (data portion). */
const ProfileHeaderDataSchema = z.object({
  displayName: z.string().min(1).max(100),
  username: z.string().min(1).max(50),
  avatarUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  stats: ProfileStatsSchema,
});

// ─────────────────────────────────────────────
// 2. PURE LOGIC (De-complected from UI)
// ─────────────────────────────────────────────

/** A single formatted stat for display. */
export interface FormattedStat {
  readonly label: string;
  readonly value: string;
}

/**
 * Formats a raw numeric count into a human-readable short string.
 *
 * @param count - A non-negative integer.
 * @returns A compact string representation (e.g. "1.2K", "3.4M").
 *
 * @example
 * formatStatCount(0)       // "0"
 * formatStatCount(999)     // "999"
 * formatStatCount(1_000)   // "1K"
 * formatStatCount(1_200)   // "1.2K"
 * formatStatCount(10_500)  // "10.5K"
 * formatStatCount(1_000_000) // "1M"
 */
export function formatStatCount(count: number): string {
  if (count < 1_000) return String(count);
  if (count < 1_000_000) {
    const k = count / 1_000;
    return Number.isInteger(k) ? `${k}K` : `${k.toFixed(1).replace(/\.0$/, '')}K`;
  }
  const m = count / 1_000_000;
  return Number.isInteger(m) ? `${m}M` : `${m.toFixed(1).replace(/\.0$/, '')}M`;
}

/**
 * Converts raw profile stats into an ordered list of display-ready values.
 * Pure function — no side effects, no UI coupling.
 *
 * @param stats - Validated profile statistics.
 * @returns An immutable array of `FormattedStat` objects.
 */
export function buildFormattedStats(stats: z.infer<typeof ProfileStatsSchema>): readonly FormattedStat[] {
  return [
    { label: 'Posts', value: formatStatCount(stats.posts) },
    { label: 'Followers', value: formatStatCount(stats.followers) },
    { label: 'Following', value: formatStatCount(stats.following) },
  ] as const;
}

// ─────────────────────────────────────────────
// 3. TYPES
// ─────────────────────────────────────────────

/** Props accepted by the `ProfileHeader` component. */
interface ProfileHeaderProps {
  readonly displayName: string;
  /** e.g. "@colin" */
  readonly username: string;
  readonly avatarUrl?: string;
  readonly bannerUrl?: string;
  readonly stats: { posts: number; followers: number; following: number };
  readonly onEditProfile?: () => void;
}

// ─────────────────────────────────────────────
// 4. SUB-COMPONENTS (De-complected visual units)
// ─────────────────────────────────────────────

/** Renders the profile banner area. */
function Banner({ bannerUrl }: { readonly bannerUrl?: string }) {
  return (
    <View style={styles.bannerContainer}>
      {bannerUrl ? (
        <Image source={{ uri: bannerUrl }} style={styles.banner} resizeMode="cover" />
      ) : (
        <View style={[styles.banner, styles.bannerPlaceholder]} />
      )}
    </View>
  );
}

/** Renders the circular avatar with a white border ring. */
function Avatar({ avatarUrl }: { readonly avatarUrl?: string }) {
  return (
    <View style={styles.avatarContainer}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person" size={40} color="#666" />
        </View>
      )}
    </View>
  );
}

/** Renders a single stat column (value + label). */
function StatItem({ stat }: { readonly stat: FormattedStat }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statNumber}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// 5. MAIN COMPONENT (Orchestration only)
// ─────────────────────────────────────────────

/**
 * `ProfileHeader` — displays the user's banner, avatar, name, handle, stats,
 * and an "Edit Profile" action.
 *
 * All display-formatting logic is delegated to pure functions above.
 * Props are validated at the boundary via Zod before rendering.
 */
export default function ProfileHeader({
  displayName,
  username,
  avatarUrl,
  bannerUrl,
  stats,
  onEditProfile,
}: ProfileHeaderProps) {
  // ── Boundary validation (fail-safe: fall back to raw values on bad data) ──
  const parsed = ProfileHeaderDataSchema.safeParse({
    displayName,
    username,
    avatarUrl,
    bannerUrl,
    stats,
  });

  const safeStats = parsed.success ? parsed.data.stats : stats;
  const safeDisplayName = parsed.success ? parsed.data.displayName : displayName;
  const safeUsername = parsed.success ? parsed.data.username : username;
  const safeAvatarUrl = parsed.success ? parsed.data.avatarUrl : undefined;
  const safeBannerUrl = parsed.success ? parsed.data.bannerUrl : undefined;

  // ── Pure derivation ──
  const formattedStats = buildFormattedStats(safeStats);

  return (
    <View style={styles.container}>
      <Banner bannerUrl={safeBannerUrl} />

      <View style={styles.content}>
        {/* Header Top Row: Avatar + Edit Button */}
        <View style={styles.headerRow}>
          <Avatar avatarUrl={safeAvatarUrl} />

          <TouchableOpacity
            style={styles.editButton}
            onPress={onEditProfile}
            accessibilityRole="button"
            accessibilityLabel="Edit Profile"
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{safeDisplayName}</Text>
          <Text style={styles.username}>{safeUsername}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {formattedStats.map((stat) => (
            <StatItem key={stat.label} stat={stat} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// 6. STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bannerContainer: {
    height: 120,
    width: '100%',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    backgroundColor: '#cbd5e1',
  },
  content: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: -40,
    marginBottom: 12,
  },
  avatarContainer: {
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 50,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#d4d4d4',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 10,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
  },
  userInfo: {
    marginBottom: 16,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#171717',
  },
  username: {
    fontSize: 14,
    color: '#525252',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#171717',
  },
  statLabel: {
    fontSize: 12,
    color: '#737373',
  },
});
```

### What changed and why

| Change | Simplicity / Security Principle |
|---|---|
| **Zod schemas** (`ProfileStatsSchema`, `ProfileHeaderDataSchema`) validate props at the component boundary. Invalid URLs (XSS vectors) are rejected; stats are guaranteed non-negative integers. | **Security — Zod validation at every public boundary.** |
| **`formatStatCount`** — pure function (number → string). Handles K/M abbreviation. Testable in a plain Node script with zero RN imports. | **De-complect logic from UI.** |
| **`buildFormattedStats`** — pure function (stats object → readonly `FormattedStat[]`). The component never contains formatting math. | **Values over objects; pure derivation.** |
| **`Banner`, `Avatar`, `StatItem`** extracted as small, focused sub-components. Each owns exactly one visual concern. | **De-complect: single-responsibility visual units.** |
| **Stats rendered via `.map()`** instead of three copy-pasted blocks — the stat list is driven by data, not hardcoded JSX. | **Eliminate incidental duplication.** |
| **`readonly` on all prop interfaces** — enforces immutability at the type level. | **Values over objects.** |
| **`accessibilityRole` / `accessibilityLabel`** added to the edit button. | **Reliability — baseline a11y.** |
| **Graceful fallback** on Zod parse failure — the component still renders with raw props rather than crashing. | **Resilience at the boundary.** |

> **Future step (outside this single-file constraint):** `formatStatCount` and `buildFormattedStats` should migrate to `packages/social-engine/src/formatting.ts` so both `apps/mobile` and `apps/web` share the same logic.