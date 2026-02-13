

```tsx
// apps/mobile/app/(tabs)/explore.tsx

import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// 1. PURE DATA & TYPES (De-complected from UI)
// ---------------------------------------------------------------------------

/** Represents a community group. */
export interface CommunityGroup {
  readonly id: number;
  readonly name: string;
  readonly members: number;
}

/** Represents a community event. */
export interface CommunityEvent {
  readonly id: number;
  readonly name: string;
  readonly time: string;
}

// ---------------------------------------------------------------------------
// 2. PURE LOGIC — extractable to packages/social-engine in a future step
// ---------------------------------------------------------------------------

/**
 * Returns the list of groups the current user belongs to.
 * Pure function: no side-effects, no DB calls.
 * TODO: Replace static seed data with Repository call.
 */
export function getUserGroups(): readonly CommunityGroup[] {
  return Object.freeze([
    { id: 1, name: 'Bible Study Group', members: 128 },
    { id: 2, name: 'Worship Team', members: 45 },
    { id: 3, name: 'Prayer Warriors', members: 312 },
  ]);
}

/**
 * Returns upcoming community events.
 * Pure function: no side-effects, no DB calls.
 * TODO: Replace static seed data with Repository call.
 */
export function getUpcomingEvents(): readonly CommunityEvent[] {
  return Object.freeze([
    { id: 1, name: 'Sunday Service', time: 'Sunday, 10:00 AM' },
  ]);
}

/**
 * Formats a member count into a human-readable label.
 * @param count - Number of members.
 * @returns Formatted string, e.g. "128 members" or "1 member".
 */
export function formatMemberCount(count: number): string {
  return `${count} ${count === 1 ? 'member' : 'members'}`;
}

// ---------------------------------------------------------------------------
// 3. PRESENTATIONAL SUB-COMPONENTS (thin UI shells)
// ---------------------------------------------------------------------------

interface GroupCardProps {
  readonly group: CommunityGroup;
  readonly onPress?: () => void;
}

/** A single group row in the community list. */
function GroupCard({ group, onPress }: GroupCardProps) {
  return (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${group.name}, ${formatMemberCount(group.members)}`}
    >
      <View style={styles.groupIcon}>
        <Ionicons name="people" size={24} color="white" />
      </View>
      <View>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupMembers}>
          {formatMemberCount(group.members)}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color="#ccc"
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

interface EventCardProps {
  readonly event: CommunityEvent;
}

/** A single event card. */
function EventCard({ event }: EventCardProps) {
  return (
    <View style={styles.eventCard} accessibilityLabel={`${event.name}, ${event.time}`}>
      <Text style={styles.eventName}>{event.name}</Text>
      <Text style={styles.eventTime}>{event.time}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 4. SCREEN COMPONENT (Orchestration only — no logic)
// ---------------------------------------------------------------------------

export default function CommunityScreen() {
  const groups = getUserGroups();
  const events = getUpcomingEvents();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Gradient Header Background */}
      <LinearGradient
        colors={[
          Colors.light.brand.gold.DEFAULT,
          Colors.light.brand.purple.DEFAULT,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBackground}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Community</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Search">
            <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Groups Section */}
          <Text style={styles.sectionTitle}>Your Groups</Text>
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}

          {/* Events Section */}
          <Text style={styles.sectionTitle}>Events</Text>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 5. STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  safeArea: {
    flex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 20,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.brand.purple.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  groupMembers: {
    fontSize: 12,
    color: '#666',
  },
  chevron: {
    marginLeft: 'auto',
  },
  eventCard: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
```

---

### ADR: Refactor `explore.tsx` — De-complect Data, Logic, and UI

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Context** | The original file embedded static data directly inside the component body, mixed inline styles with structural JSX, and had no separation between data, logic, and presentation. |
| **Decision** | 1. **Pure Data/Types** — `CommunityGroup` and `CommunityEvent` interfaces defined at the top; immutable (`readonly`, `Object.freeze`). <br>2. **Pure Functions** — `getUserGroups()`, `getUpcomingEvents()`, and `formatMemberCount()` are exported, side-effect-free, and testable in a plain Node script. They are staging points for a future move to `packages/social-engine`. <br>3. **Presentational Components** — `GroupCard` and `EventCard` are thin, props-driven shells with no business logic. <br>4. **Orchestration** — `CommunityScreen` does nothing but call pure functions and compose UI components. <br>5. **Accessibility** — Added `accessibilityRole` and `accessibilityLabel` to interactive and semantic elements. <br>6. **Style hygiene** — Moved the inline `marginLeft: 'auto'` into the `StyleSheet` (`chevron`). |
| **Consequences** | All exported pure functions can be unit-tested without mocking React Native. When a Repository layer is introduced (e.g., `expo-sqlite` or Supabase), only `getUserGroups` / `getUpcomingEvents` need to be replaced — the UI and formatting logic remain untouched. |