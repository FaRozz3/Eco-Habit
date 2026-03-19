import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import {
  useHabits,
  Habit,
  calcEcoPoints,
  calcLevel,
  pointsToNextLevel,
  levelTitle,
} from '../contexts/HabitContext';
import { colors, glassCard, spacing, radius, typography } from '../theme';
import { useI18n } from '../contexts/I18nContext';
import { getCompletionByRange, TimeRange, CompletionDataPoint } from '../services/localDb';

/* ── Completion data hook ──────────────────────────────────────────────── */

const DAY_KEYS = ['days.mon', 'days.tue', 'days.wed', 'days.thu', 'days.fri', 'days.sat', 'days.sun'];
const MONTH_KEYS = [
  'months.jan', 'months.feb', 'months.mar', 'months.apr',
  'months.may', 'months.jun', 'months.jul', 'months.aug',
  'months.sep', 'months.oct', 'months.nov', 'months.dec',
];

function useCompletionData(timeframe: TimeRange) {
  const { t, locale } = useI18n();
  const [labels, setLabels] = useState<string[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getCompletionByRange(timeframe).then((data: CompletionDataPoint[]) => {
      if (cancelled) return;

      const newLabels = data.map((dp) => {
        if (timeframe === 'week') {
          // label is "1"–"7" (1=Mon, 7=Sun), map to translated day names
          const idx = parseInt(dp.label, 10) - 1;
          return t(DAY_KEYS[idx]);
        } else if (timeframe === 'year') {
          // label is "1"–"12", map to translated month names
          const idx = parseInt(dp.label, 10) - 1;
          return t(MONTH_KEYS[idx]);
        }
        // month: label is day number, use as-is
        return dp.label;
      });

      setLabels(newLabels);
      setValues(data.map((dp) => dp.ratio));
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [timeframe, locale]);

  return { labels, values, loading };
}

/* ── Main screen ──────────────────────────────────────────────────────────── */

type Timeframe = 'week' | 'month' | 'year';

export default function StatsScreen() {
  const { habits } = useHabits();
  const { t } = useI18n();
  const [timeframe, setTimeframe] = React.useState<Timeframe>('week');

  const stats = useMemo(() => {
    const ecoPoints = calcEcoPoints(habits);
    const level = calcLevel(ecoPoints);
    const title = levelTitle(level);
    const maxStreak = habits.reduce((m: number, h: Habit) => Math.max(m, h.streak), 0);
    const done = habits.filter((h: Habit) => h.completed_today).length;
    const ptnl = pointsToNextLevel(ecoPoints);
    const progressPct = ecoPoints % 100; // progress within current level
    return { ecoPoints, level, title, maxStreak, done, ptnl, progressPct };
  }, [habits]);

  /* Connect completion data hook to timeframe */
  const { labels, values, loading } = useCompletionData(timeframe);

  /* Compute average completion rate from values */
  const completionRate = useMemo(() => {
    if (values.length === 0) return 0;
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.round(avg * 100);
  }, [values]);

  /* ── Streak grouping logic (Task 5.1) ─────────────────────────────── */
  const streakGroups = useMemo(() => {
    const groups = new Map<number, Habit[]>();
    habits.filter(h => h.streak > 0).forEach(h => {
      const list = groups.get(h.streak) || [];
      list.push(h);
      groups.set(h.streak, list);
    });
    return Array.from(groups.entries())
      .map(([streakValue, habits]) => ({ streakValue, habits }))
      .sort((a, b) => b.streakValue - a.streakValue);
  }, [habits]);

  const [expandedStreaks, setExpandedStreaks] = useState<Set<number>>(new Set());

  const toggleStreak = (streakValue: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedStreaks(prev => {
      const next = new Set(prev);
      if (next.has(streakValue)) {
        next.delete(streakValue);
      } else {
        next.add(streakValue);
      }
      return next;
    });
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.iconButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t('stats.headerTitle')}</Text>
          <TouchableOpacity style={s.iconButton}>
            <MaterialCommunityIcons name="share-variant" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Timeframe Selector */}
        <View style={s.segmentContainer}>
          {/* Timeframe Segments */}
          {['week', 'month', 'year'].map((tf) => {
            const isActive = timeframe === tf;
            let tfKey = tf;
            if (tf === 'week') tfKey = 'timeWeek';
            if (tf === 'month') tfKey = 'timeMonth';
            if (tf === 'year') tfKey = 'timeYear';

            return (
              <TouchableOpacity
                key={tf}
                style={[s.segmentButton, isActive && s.segmentButtonActive]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setTimeframe(tf as Timeframe);
                }}
              >
                <Text style={[s.segmentText, isActive && s.segmentTextActive]}>
                  {t(`stats.${tfKey}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Top Habits Breakdown */}
      {habits.length > 0 && (
        <View style={s.glassSection}>
          <View style={s.breakdownTitleRow}>
            <MaterialCommunityIcons name="chart-donut" size={20} color={colors.primary} />
            <Text style={s.breakdownTitle}>{t('stats.topHabits')}</Text>
          </View>
          <View style={s.breakdownList}>
            {habits
              .slice()
              .sort((a: any, b: any) => {
                const aScore = a.last_7_days.filter(Boolean).length;
                const bScore = b.last_7_days.filter(Boolean).length;
                if (aScore !== bScore) return bScore - aScore;
                return b.streak - a.streak;
              })
              .slice(0, 3) // Top 3 habits
              .map((h, index) => {
                const score = h.last_7_days.filter(Boolean).length;
                const pct = Math.round((score / 7) * 100);
                // Alternate colors for aesthetic
                const barColor = index === 1 ? colors.accent : index === 2 ? '#8B95A8' : colors.primary;
                const glowColor = index === 1 ? 'rgba(187, 134, 252, 0.4)' : index === 2 ? 'transparent' : 'rgba(0, 245, 159, 0.4)';

                return (
                  <View key={h.id} style={s.breakdownItem}>
                    <View style={s.breakdownLabelRow}>
                      <Text style={s.breakdownName}>{h.name}</Text>
                      <Text style={[s.breakdownPct, { color: barColor }]}>{pct}%</Text>
                    </View>
                    <View style={s.breakdownTrack}>
                      <View
                        style={[
                          s.breakdownFill,
                          { width: `${pct}%`, backgroundColor: barColor },
                          glowColor !== 'transparent' && {
                            shadowColor: barColor,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.8,
                            shadowRadius: 6,
                            elevation: 4,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      
        {/* Growth Trend Chart */}
        <View style={s.glassSection}>
          <View style={s.trendHeader}>
            <View>
              <Text style={s.trendSubtitle}>{t('stats.trendSubtitle')}</Text>
              <View style={s.trendValueRow}>
                <Text style={s.trendValue}>{completionRate}%</Text>
                <Text style={s.trendLabel}>{t('stats.trendLabel')}</Text>
              </View>
            </View>
          </View>
          
          <View style={s.chartBox}>
            <Svg viewBox="-10 -10 420 180" width="100%" height="100%" preserveAspectRatio="none">
              <Defs>
                <SvgLinearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.9" />
                  <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.4" />
                </SvgLinearGradient>
              </Defs>
              {values.map((val, i) => {
                const chartWidth = 400;
                const maxHeight = 150;
                const barWidth = (chartWidth / Math.max(values.length, 1)) * 0.6;
                const gap = (chartWidth / Math.max(values.length, 1)) * 0.4;
                const x = i * (barWidth + gap) + gap / 2;
                const barHeight = Math.max(val * maxHeight, 0);
                const y = maxHeight - barHeight;
                return (
                  <Rect
                    key={i}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={3}
                    fill="url(#barGradient)"
                  />
                );
              })}
            </Svg>
            <View style={s.chartDaysList}>
              {labels.map((lbl: string, i: number) => {
                let showLabel = true;
                if (timeframe === 'month') {
                  const dayNum = parseInt(lbl, 10);
                  // Show 1, 5, 10, 15, 20, 25, 30 and the last day
                  showLabel =
                    dayNum === 1 ||
                    dayNum % 5 === 0 ||
                    i === labels.length - 1;
                } else if (timeframe === 'year') {
                  // Show alternate months (Ene, Mar, May, Jul, Sep, Nov)
                  showLabel = i % 2 === 0;
                }

                return (
                  <View key={i} style={s.chartDayContainer}>
                    <Text style={[s.chartDayText, !showLabel && { opacity: 0 }]}>
                      {lbl}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Bento Grid */}
        <View style={s.bentoGrid}>
          <View style={s.bentoRow}>
            {/* Total Habits */}
            <View style={[s.bentoBox, s.bentoSquare, s.borderLeftPurple]}>
              <MaterialCommunityIcons name="check-circle-outline" size={32} color={colors.accent} />
              <View>
                <Text style={s.bentoValue}>{habits.length}</Text>
                <Text style={s.bentoLabel}>{t('stats.bentoTotal')}</Text>
              </View>
            </View>

            {/* Eco Impact */}
            <View style={[s.bentoBox, s.bentoSquare]}>
              <View style={s.ecoIconContainer}>
                <MaterialCommunityIcons name="leaf" size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={s.bentoValue}>{stats.ecoPoints}</Text>
                <Text style={s.bentoLabel}>{t('stats.bentoEco')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Expandable Streak List (Task 5.2) */}
        <View style={s.glassSection}>
          <View style={s.streakSectionHeader}>
            <MaterialCommunityIcons name="fire" size={20} color={colors.primary} />
            <Text style={s.streakSectionTitle}>{t('stats.bentoStreak')}</Text>
          </View>

          {streakGroups.length === 0 ? (
            <Text style={s.noStreaksText}>{t('stats.noActiveStreaks')}</Text>
          ) : (
            streakGroups.map(group => {
              const isExpanded = expandedStreaks.has(group.streakValue);
              return (
                <View key={group.streakValue}>
                  <TouchableOpacity
                    style={s.streakGroupRow}
                    onPress={() => toggleStreak(group.streakValue)}
                    activeOpacity={0.7}
                  >
                    <View style={s.streakGroupLeft}>
                      <MaterialCommunityIcons name="fire" size={22} color={colors.primary} />
                      <Text style={s.streakGroupValue}>
                        {t('stats.streakDays', { days: group.streakValue })}
                      </Text>
                    </View>
                    <View style={s.streakGroupRight}>
                      <Text style={s.streakGroupCount}>
                        {t('stats.habitsCount', { count: group.habits.length })}
                      </Text>
                      <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={s.streakHabitsList}>
                      {group.habits.map(h => (
                        <View key={h.id} style={s.streakHabitRow}>
                          <View style={[s.streakHabitIcon, { backgroundColor: `${h.color}1A` }]}>
                            <MaterialCommunityIcons name={h.icon as any} size={20} color={h.color} />
                          </View>
                          <Text style={s.streakHabitName} numberOfLines={1}>{h.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Styles ───────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 100 },

  /* Header & Segments */
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    ...typography.small,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.background,
    fontWeight: '600',
  },

  /* Chart */
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  trendSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '500',
  },
  trendValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  trendValue: {
    ...typography.h1,
    color: colors.primary,
    lineHeight: 36,
  },

  /* Breakdown */
  breakdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  breakdownTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  breakdownList: {
    gap: spacing.xl,
  },
  breakdownItem: {
    gap: spacing.sm,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownName: {
    ...typography.small,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  breakdownPct: {
    ...typography.small,
    fontWeight: '700',
  },
  breakdownTrack: {
    height: 8,
    width: '100%',
    backgroundColor: '#1E232E',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  trendLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 159, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  trendBadgeText: {
    ...typography.small,
    fontWeight: '700',
    color: colors.primary,
  },
  chartBox: {
    height: 160,
    width: '100%',
    marginTop: spacing.sm,
  },
  chartDaysList: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  chartDayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartDayText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Bento Box */
  bentoGrid: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bentoBox: {
    ...glassCard,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  bentoSquare: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'space-between',
  },
  bentoBoxFull: {
    width: '100%',
  },
  borderLeftPurple: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  bentoValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  bentoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  ecoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 245, 159, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Glass sections */
  glassSection: {
    ...glassCard,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.text },

  /* Expandable Streak List */
  streakSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  streakSectionTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  noStreaksText: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  streakGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  streakGroupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakGroupValue: {
    ...typography.bodyBold,
    color: colors.text,
  },
  streakGroupRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakGroupCount: {
    ...typography.small,
    color: colors.textSecondary,
  },
  streakHabitsList: {
    paddingLeft: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  streakHabitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  streakHabitIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakHabitName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
});
