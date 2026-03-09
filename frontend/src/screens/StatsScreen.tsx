import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useHabits,
  calcEcoPoints,
  calcLevel,
  pointsToNextLevel,
  levelTitle,
} from '../contexts/HabitContext';
import { colors, glassCard, gradient, spacing, radius, typography } from '../theme';
import { useI18n } from '../contexts/I18nContext';

/* ── Small stat card ──────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
}) {
  return (
    <View style={s.statCard}>
      <MaterialCommunityIcons name={icon} size={28} color={iconColor} style={s.statIcon} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

/* ── Weekly bar ───────────────────────────────────────────────────────────── */

function WeekBar({
  day,
  ratio,
  active,
}: {
  day: string;
  ratio: number;
  active: boolean;
}) {
  const height = Math.max(4, ratio * 80);
  return (
    <View style={s.barCol}>
      <View style={s.barTrack}>
        {active ? (
          <LinearGradient
            colors={[gradient.start, gradient.end]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={[s.barFill, { height }]}
          />
        ) : (
          <View style={[s.barFill, { height, backgroundColor: colors.surfaceLight }]} />
        )}
      </View>
      <Text style={[s.barDay, active && { color: colors.textSecondary }]}>{day}</Text>
    </View>
  );
}

/* ── Main screen ──────────────────────────────────────────────────────────── */

export default function StatsScreen() {
  const { habits } = useHabits();
  const { t } = useI18n();

  const stats = useMemo(() => {
    const ecoPoints = calcEcoPoints(habits);
    const level = calcLevel(ecoPoints);
    const title = levelTitle(level);
    const maxStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
    const done = habits.filter((h) => h.completed_today).length;
    const ptnl = pointsToNextLevel(ecoPoints);
    const progressPct = ecoPoints % 100; // progress within current level
    return { ecoPoints, level, title, maxStreak, done, ptnl, progressPct };
  }, [habits]);

  /* Weekly completion ratios (Mon–Sun) derived from last_7_days */
  const { locale } = useI18n();
  const DAYS = useMemo(() => {
    return locale === 'es'
      ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }, [locale]);

  const todayDow = (new Date().getDay() + 6) % 7; // 0=Mon … 6=Sun

  const weekBars = useMemo(() => {
    if (habits.length === 0) {
      return DAYS.map((day) => ({ day, ratio: 0, active: false }));
    }
    // last_7_days[6] = today, last_7_days[5] = yesterday, …, last_7_days[0] = 6 days ago
    // Map each Mon–Sun slot to the corresponding last_7_days index
    return DAYS.map((day, dow) => {
      const daysAgo = todayDow - dow; // negative means future day this week
      if (daysAgo < 0 || daysAgo > 6) {
        return { day, ratio: 0, active: false };
      }
      const l7Index = 6 - daysAgo; // convert daysAgo to last_7_days index
      const completed = habits.filter((h) => h.last_7_days[l7Index]).length;
      return { day, ratio: completed / habits.length, active: true };
    });
  }, [habits, todayDow]);

  const completionRatio =
    habits.length > 0 ? `${stats.done}/${habits.length}` : '0/0';

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Summary stat cards */}
        <View style={s.cardRow}>
          <StatCard label={t('stats.maxStreak')} value={`${stats.maxStreak}d`} icon="lightning-bolt" iconColor="#E67E22" />
          <StatCard label={t('stats.today')} value={completionRatio} icon="check-circle-outline" iconColor={colors.primary} />
          <StatCard label={t('stats.ecoPoints')} value={stats.ecoPoints.toLocaleString()} icon="leaf" iconColor="#27AE60" />
        </View>

        {/* Level progress */}
        <View style={s.glassSection}>
          <View style={s.levelHeader}>
            <Text style={s.sectionTitle}>
              Level {stats.level} • {stats.title}
            </Text>
            <Text style={s.accentCaption}>{stats.ptnl} {t('stats.ptsToNext')}</Text>
          </View>
          <View style={s.levelTrack}>
            {stats.progressPct > 0 && (
              <LinearGradient
                colors={[gradient.start, gradient.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[s.levelFill, { width: `${stats.progressPct}%` }]}
              />
            )}
          </View>
        </View>

        {/* Weekly chart */}
        <View style={s.glassSection}>
          <Text style={s.sectionTitle}>{t('stats.thisWeek')}</Text>
          <View style={s.barsRow}>
            {weekBars.map(({ day, ratio, active }) => (
              <WeekBar key={day} day={day} ratio={ratio} active={active} />
            ))}
          </View>
        </View>

        {/* Empty state motivational message */}
        {habits.length === 0 && (
          <View style={s.glassSection}>
            <MaterialCommunityIcons name="chart-bar" size={48} color={colors.primary} style={s.emptyIcon} />
            <Text style={s.emptyTitle}>{t('stats.noStats')}</Text>
            <Text style={s.emptyBody}>
              {t('stats.noStatsHint')}
            </Text>
          </View>
        )}

        {/* Habit streak list */}
        {habits.length > 0 && (
          <View style={s.glassSection}>
            <Text style={s.sectionTitle}>{t('stats.activeStreaks')}</Text>
            {habits.map((h) => (
              <View key={h.id} style={s.habitRow}>
                <View style={[s.habitIcon, { backgroundColor: (h.color || colors.accent) + '33' }]}>
                  <Text style={{ fontSize: 18 }}>{h.icon}</Text>
                </View>
                <View style={s.habitInfo}>
                  <Text style={s.habitName} numberOfLines={1}>
                    {h.name}
                  </Text>
                  {h.goal ? <Text style={s.habitGoal}>{h.goal}</Text> : null}
                </View>
                <Text style={[s.habitStreak, { color: h.color || colors.primary }]}>
                  🔥 {h.streak}d
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Styles ───────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 100 },

  /* Stat cards row */
  cardRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    ...glassCard,
    padding: spacing.md,
    alignItems: 'center',
  },
  statIcon: { marginBottom: spacing.xs },
  statValue: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  /* Glass sections */
  glassSection: {
    ...glassCard,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.text },

  /* Level progress */
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  accentCaption: { ...typography.small, color: colors.primary },
  levelTrack: {
    height: 8,
    backgroundColor: colors.progressBg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelFill: { height: 8, borderRadius: 4 },

  /* Weekly chart */
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    marginTop: spacing.md,
  },
  barCol: { alignItems: 'center', flex: 1 },
  barTrack: {
    width: 22,
    height: 80,
    backgroundColor: colors.progressBg,
    borderRadius: 11,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 11 },
  barDay: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },

  /* Habit list */
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  habitIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitInfo: { flex: 1 },
  habitName: { ...typography.bodyBold, color: colors.text },
  habitGoal: { ...typography.small, color: colors.textSecondary },
  habitStreak: { ...typography.caption, fontWeight: '700' },

  /* Empty state */
  emptyIcon: { textAlign: 'center', marginBottom: spacing.sm, alignSelf: 'center' },
  emptyTitle: {
    ...typography.bodyBold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptyBody: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
