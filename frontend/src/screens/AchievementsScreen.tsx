import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useHabits,
  calcEcoPoints,
  calcLevel,
  levelTitle,
  pointsToNextLevel,
} from '../contexts/HabitContext';
import { colors, glassCard, gradient, spacing, radius, typography } from '../theme';
import { useI18n } from '../contexts/I18nContext';

/* ── Badge card ───────────────────────────────────────────────────────────── */

interface BadgeCardProps {
  icon: string;
  label: string;
  desc: string;
  earned: boolean;
  color: string;
}

function BadgeCard({ icon, label, desc, earned, color }: BadgeCardProps) {
  return (
    <View style={[bs.card, !earned && bs.locked]}>
      <View
        style={[
          bs.iconBg,
          { backgroundColor: earned ? color + '28' : colors.surfaceLight },
        ]}
      >
        <Text style={bs.icon}>{earned ? icon : '🔒'}</Text>
      </View>
      <Text style={[bs.label, !earned && { color: colors.textMuted }]}>{label}</Text>
      <Text style={bs.desc}>{desc}</Text>
      {earned && <View style={[bs.dot, { backgroundColor: color }]} />}
    </View>
  );
}

const bs = StyleSheet.create({
  card: {
    width: '47%',
    ...glassCard,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  locked: { opacity: 0.45 },
  iconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: { fontSize: 30 },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  desc: { ...typography.small, color: colors.textMuted, textAlign: 'center', lineHeight: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: spacing.xs },
});


/* ── Main screen ──────────────────────────────────────────────────────────── */

export default function AchievementsScreen() {
  const { habits } = useHabits();
  const { t } = useI18n();

  const stats = useMemo(() => {
    const ecoPoints = calcEcoPoints(habits);
    const level = calcLevel(ecoPoints);
    const title = levelTitle(level);
    const maxStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
    const totalDays = habits.reduce((s, h) => s + h.streak, 0);
    const habitsWith7 = habits.filter((h) => h.streak >= 7).length;
    const habitsWith30 = habits.filter((h) => h.streak >= 30).length;
    const iconCount = new Set(habits.map((h) => h.icon)).size;
    const colorCount = new Set(habits.map((h) => h.color)).size;
    const completedToday = habits.filter((h) => h.completed_today).length;
    const ptnl = pointsToNextLevel(ecoPoints);
    const progressPct = ecoPoints % 100;
    return {
      ecoPoints, level, title, maxStreak, totalDays,
      habitsWith7, habitsWith30, iconCount, colorCount,
      completedToday, ptnl, progressPct,
    };
  }, [habits]);

  const categories = [
    {
      title: `🌱  ${t('achievements.firstSteps')}`,
      badges: [
        { icon: '🌱', label: t('badges.firstSprout'), desc: t('badges.firstSproutDesc'), earned: habits.length >= 1, color: colors.accent },
        { icon: '🌿', label: t('badges.growingGarden'), desc: t('badges.growingGardenDesc'), earned: habits.length >= 3, color: '#27AE60' },
        { icon: '🌳', label: t('badges.ownForest'), desc: t('badges.ownForestDesc'), earned: habits.length >= 5, color: '#1E8449' },
        { icon: '🎋', label: t('badges.fullEcosystem'), desc: t('badges.fullEcosystemDesc'), earned: habits.length >= 10, color: '#145A32' },
      ],
    },
    {
      title: `🔥  ${t('achievements.streaks')}`,
      badges: [
        { icon: '🔥', label: t('badges.firstSpark'), desc: t('badges.firstSparkDesc'), earned: stats.maxStreak >= 3, color: '#E67E22' },
        { icon: '💎', label: t('badges.diamondWeek'), desc: t('badges.diamondWeekDesc'), earned: stats.maxStreak >= 7, color: '#3498DB' },
        { icon: '🌙', label: t('badges.twoWeeks'), desc: t('badges.twoWeeksDesc'), earned: stats.maxStreak >= 14, color: '#9B59B6' },
        { icon: '👑', label: t('badges.habitMaster'), desc: t('badges.habitMasterDesc'), earned: stats.maxStreak >= 30, color: '#F1C40F' },
        { icon: '🦁', label: t('badges.steadyKing'), desc: t('badges.steadyKingDesc'), earned: stats.maxStreak >= 60, color: '#D4AC0D' },
        { icon: '🏆', label: t('badges.livingLegend'), desc: t('badges.livingLegendDesc'), earned: stats.maxStreak >= 100, color: '#F39C12' },
      ],
    },
    {
      title: `⭐  ${t('achievements.consistency')}`,
      badges: [
        { icon: '⭐', label: t('badges.perfectDay'), desc: t('badges.perfectDayDesc'), earned: habits.length > 0 && stats.completedToday === habits.length, color: colors.purple },
        { icon: '💪', label: t('badges.consistent'), desc: t('badges.consistentDesc'), earned: stats.habitsWith7 >= 2, color: '#E74C3C' },
        { icon: '🧘', label: t('badges.balance'), desc: t('badges.balanceDesc'), earned: stats.habitsWith7 >= 3, color: '#1ABC9C' },
      ],
    },
    {
      title: `🌍  ${t('achievements.impact')}`,
      badges: [
        { icon: '🚀', label: t('badges.liftoff'), desc: t('badges.liftoffDesc'), earned: stats.totalDays >= 30, color: '#5DADE2' },
        { icon: '🌟', label: t('badges.supernova'), desc: t('badges.supernovaDesc'), earned: stats.totalDays >= 100, color: '#F8C471' },
        { icon: '🌈', label: t('badges.allColors'), desc: t('badges.allColorsDesc'), earned: stats.habitsWith30 >= 2, color: '#E91E63' },
        { icon: '🌍', label: t('badges.ecoConscious'), desc: t('badges.ecoConsciousDesc'), earned: stats.iconCount >= 4, color: '#27AE60' },
        { icon: '🎨', label: t('badges.fullPalette'), desc: t('badges.fullPaletteDesc'), earned: stats.colorCount >= 6, color: '#E74C3C' },
        { icon: '🔬', label: t('badges.scientist'), desc: t('badges.scientistDesc'), earned: habits.length >= 5, color: '#3498DB' },
        { icon: '🦋', label: t('badges.metamorphosis'), desc: t('badges.metamorphosisDesc'), earned: stats.totalDays >= 50, color: '#9B59B6' },
      ],
    },
    {
      title: `🏅  ${t('achievements.level')} (Lv.${stats.level} ${stats.title})`,
      badges: [
        { icon: '🌱', label: t('badges.ecoSeedlingBadge'), desc: t('badges.ecoSeedlingBadgeDesc'), earned: stats.level >= 5, color: '#27AE60' },
        { icon: '🌿', label: t('badges.ecoSproutBadge'), desc: t('badges.ecoSproutBadgeDesc'), earned: stats.level >= 10, color: colors.accent },
        { icon: '🛡️', label: t('badges.ecoGuardianBadge'), desc: t('badges.ecoGuardianBadgeDesc'), earned: stats.level >= 20, color: '#3498DB' },
        { icon: '⚔️', label: t('badges.ecoRangerBadge'), desc: t('badges.ecoRangerBadgeDesc'), earned: stats.level >= 35, color: '#F1C40F' },
        { icon: '👑', label: t('badges.ecoLegendBadge'), desc: t('badges.ecoLegendBadgeDesc'), earned: stats.level >= 50, color: '#F39C12' },
        { icon: '🌌', label: t('badges.ecoMasterBadge'), desc: t('badges.ecoMasterBadgeDesc'), earned: stats.level >= 75, color: '#E91E63' },
      ],
    },
  ];

  const total = categories.reduce((s, c) => s + c.badges.length, 0);
  const earned = categories.reduce((s, c) => s + c.badges.filter((b) => b.earned).length, 0);
  const pct = total > 0 ? earned / total : 0;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>{t('achievements.title')}</Text>
            <Text style={s.headerSub}>{earned}/{total} {t('achievements.unlocked')}</Text>
          </View>
          <View style={s.xpBadge}>
            <Text style={s.xpBadgeText}>Lv.{stats.level}</Text>
          </View>
        </View>

        {/* Overall progress bar */}
        <View style={s.overallTrack}>
          {pct > 0 && (
            <LinearGradient
              colors={[gradient.start, gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.overallFill, { width: `${pct * 100}%` }]}
            />
          )}
        </View>

        {/* Level card */}
        <View style={s.levelCard}>
          <Text style={s.levelTitle}>{stats.title}</Text>
          <Text style={s.levelSub}>
            {stats.ecoPoints.toLocaleString()} Eco Points • {stats.ptnl} {t('achievements.toNextLevel')}
          </Text>
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

        {/* Badge categories */}
        {categories.map((cat) => (
          <View key={cat.title} style={s.catBlock}>
            <Text style={s.catTitle}>{cat.title}</Text>
            <View style={s.badgeGrid}>
              {cat.badges.map((b) => (
                <BadgeCard key={b.label} {...b} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}


/* ── Styles ───────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 100 },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerTitle: { ...typography.h3, color: colors.text },
  headerSub: { ...typography.caption, color: colors.primary },
  xpBadge: {
    backgroundColor: colors.accentDim,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.accent + '55',
  },
  xpBadgeText: { ...typography.caption, color: colors.accent, fontWeight: '700' },

  /* Overall progress */
  overallTrack: {
    height: 6,
    backgroundColor: colors.progressBg,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  overallFill: { height: '100%', borderRadius: 3 },

  /* Level card */
  levelCard: {
    ...glassCard,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  levelTitle: { ...typography.bodyBold, color: colors.accent, marginBottom: 2 },
  levelSub: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  levelTrack: {
    height: 8,
    backgroundColor: colors.progressBg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelFill: { height: 8, borderRadius: 4 },

  /* Category blocks */
  catBlock: { marginBottom: spacing.lg },
  catTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
