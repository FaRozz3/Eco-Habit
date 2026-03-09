import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHabits } from '../contexts/HabitContext';
import AddHabitModal from './AddHabitModal';
import { colors, glassCard, spacing } from '../theme';

/* ── Tab icon components built with Views ── */

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? colors.primary : colors.textMuted;
  return (
    <View style={styles.iconWrap}>
      {/* 2x2 grid of rounded squares */}
      <View style={styles.gridRow}>
        <View style={[styles.gridDot, { backgroundColor: c }]} />
        <View style={[styles.gridDot, { backgroundColor: c }]} />
      </View>
      <View style={styles.gridRow}>
        <View style={[styles.gridDot, { backgroundColor: c }]} />
        <View style={[styles.gridDot, { backgroundColor: c }]} />
      </View>
    </View>
  );
}

function StatsIcon({ active }: { active: boolean }) {
  const c = active ? colors.primary : colors.textMuted;
  return (
    <View style={[styles.iconWrap, { flexDirection: 'row', alignItems: 'flex-end', gap: 3 }]}>
      <View style={[styles.bar, { height: 8, backgroundColor: c }]} />
      <View style={[styles.bar, { height: 14, backgroundColor: c }]} />
      <View style={[styles.bar, { height: 11, backgroundColor: c }]} />
    </View>
  );
}

function AchievementsIcon({ active }: { active: boolean }) {
  const c = active ? colors.primary : colors.textMuted;
  return (
    <View style={styles.iconWrap}>
      {/* Trophy shape: cup + handles */}
      <View style={[styles.trophyCup, { borderColor: c }]}>
        <View style={[styles.trophyStar, { backgroundColor: c }]} />
      </View>
      <View style={[styles.trophyBase, { backgroundColor: c }]} />
    </View>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  const c = active ? colors.primary : colors.textMuted;
  return (
    <View style={styles.iconWrap}>
      {/* Person silhouette: circle head + body arc */}
      <View style={[styles.personHead, { backgroundColor: c }]} />
      <View style={[styles.personBody, { borderColor: c }]} />
    </View>
  );
}

const TAB_COMPONENTS: Record<string, React.FC<{ active: boolean }>> = {
  Today: HomeIcon,
  Stats: StatsIcon,
  Achievements: AchievementsIcon,
  Settings: SettingsIcon,
};

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const [addVisible, setAddVisible] = useState(false);
  const { addHabit } = useHabits();
  const insets = useSafeAreaInsets();

  const routes = state.routes;
  const leftRoutes = routes.slice(0, 2);
  const rightRoutes = routes.slice(2);

  const renderTab = (route: (typeof routes)[number], index: number) => {
    const isFocused = state.index === index;
    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const IconComp = TAB_COMPONENTS[route.name];
    return (
      <TouchableOpacity
        key={route.key}
        style={styles.tab}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={route.name}
      >
        {IconComp ? <IconComp active={isFocused} /> : <View style={styles.iconWrap} />}
        {isFocused && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.barContainer}>
        {/* Left tabs */}
        <View style={styles.tabGroup}>
          {leftRoutes.map((r, i) => renderTab(r, i))}
        </View>

        {/* Center FAB */}
        <View style={styles.fabWrapper}>
          <View style={styles.fabGlow} />
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setAddVisible(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Add new habit"
          >
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Right tabs */}
        <View style={styles.tabGroup}>
          {rightRoutes.map((r, i) => renderTab(r, i + 2))}
        </View>
      </View>

      <AddHabitModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onAdd={addHabit}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    ...glassCard,
    borderRadius: 28,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  fabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -32,
    marginHorizontal: spacing.md,
  },
  fabGlow: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryGlow,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.background,
    fontWeight: '300',
    lineHeight: 30,
  },
  /* ── Icon building blocks ── */
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Home: 2x2 grid
  gridRow: {
    flexDirection: 'row',
    gap: 3,
  },
  gridDot: {
    width: 8,
    height: 8,
    borderRadius: 2.5,
  },
  // Stats: bar chart
  bar: {
    width: 5,
    borderRadius: 2,
  },
  // Trophy
  trophyCup: {
    width: 16,
    height: 12,
    borderWidth: 1.5,
    borderRadius: 3,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyStar: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  trophyBase: {
    width: 10,
    height: 2,
    borderRadius: 1,
    marginTop: 1,
  },
  // Person
  personHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  personBody: {
    width: 16,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    marginTop: 2,
  },
});
