import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Dimensions, Modal, Pressable, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useHabits,
  calcEcoPoints,
  calcLevel,
  levelTitle,
  pointsToNextLevel,
} from '../contexts/HabitContext';
import { useAchievements, type Badge } from '../contexts/AchievementContext';
import { colors, glassCard, spacing, radius, typography } from '../theme';
import { useI18n } from '../contexts/I18nContext';

const { width } = Dimensions.get('window');

/* ── Badge Card Component ─────────────────────────────────────────────────── */

function BadgeCard({ icon, label, earned, claimed, isPurple, onPress }: { icon: string; label: string; earned: boolean; claimed: boolean; isPurple?: boolean; onPress: () => void }) {
  const { t } = useI18n();
  const title = t(label) || label;

  if (!earned) {
    return (
      <TouchableOpacity style={[gs.bentoCard, gs.lockedCard]} onPress={onPress} activeOpacity={0.7}>
        <View style={gs.lockedIconBg}>
          <MaterialCommunityIcons name={icon as any} size={28} color={colors.textMuted} />
        </View>
        <Text style={gs.lockedLabel} numberOfLines={2} adjustsFontSizeToFit>{title}</Text>
      </TouchableOpacity>
    );
  }

  // Earned
  return (
    <TouchableOpacity style={[gs.bentoCard, isPurple ? gs.neonGlowPurpleCard : gs.neonGlowGreenCard]} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={isPurple ? [colors.accent, '#4a148c'] : [colors.primary, '#00d1ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[gs.clayIcon, isPurple && gs.shadowPurple]}
      >
        <MaterialCommunityIcons name={icon as any} size={28} color="#FFF" />
      </LinearGradient>
      {!claimed && (
         <View style={gs.unclaimedDot} />
      )}
      <Text style={gs.bentoLabel} numberOfLines={2} adjustsFontSizeToFit>{title}</Text>
    </TouchableOpacity>
  );
}

/* ── Main Screen ──────────────────────────────────────────────────────────── */

export default function AchievementsScreen() {
  const { habits } = useHabits();
  const { t } = useI18n();
  const [filter, setFilter] = useState<'all' | 'locked'>('all');

  const stats = useMemo(() => {
    const ecoPoints = calcEcoPoints(habits);
    const level = calcLevel(ecoPoints);
    const title = levelTitle(level);
    const ptnl = pointsToNextLevel(ecoPoints);
    const progressPct = Math.min((ecoPoints % 100) / 100, 1) * 100;
    return { ecoPoints, level, title, ptnl, progressPct };
  }, [habits]);

  const { badges: allBadges, claimBadge } = useAchievements();

  // Group badges into categories
  const categories = useMemo(() => {
    const filterFn = (b: Badge) => filter === 'all' ? true : !b.earned;
        // We'll define manual groupings for the new aesthetics
    const ecoImpactKeys = ['badges.seedling', 'badges.hydroHero', 'badges.solarSoul', 'badges.firstSprout', 'badges.growingGarden', 'badges.ownForest', 'badges.fullEcosystem', 'badges.ecoConscious', 'badges.fullPalette'];
    const consistencyKeys = ['badges.sevenDayStreak', 'badges.thirtyDays', 'badges.unstoppable', 'badges.firstSpark', 'badges.diamondWeek', 'badges.twoWeeks', 'badges.habitMaster', 'badges.steadyKing', 'badges.livingLegend', 'badges.perfectDay', 'badges.consistent', 'badges.balance'];
    const mindfulnessKeys = ['badges.zenMaster', 'badges.innerCalm', 'badges.dreamer', 'badges.liftoff', 'badges.supernova', 'badges.allColors', 'badges.scientist', 'badges.metamorphosis'];
    const levelKeys = ['badges.ecoSeedlingBadge', 'badges.ecoSproutBadge', 'badges.ecoGuardianBadge', 'badges.ecoRangerBadge', 'badges.ecoLegendBadge', 'badges.ecoMasterBadge'];

    return [
      {
        title: t('achievements.ecoImpact'),
        theme: 'green',
        badges: allBadges.filter(b => ecoImpactKeys.includes(b.label)).filter(filterFn),
      },
      {
        title: t('achievements.consistency'),
        theme: 'purple',
        badges: allBadges.filter(b => consistencyKeys.includes(b.label)).filter(filterFn),
      },
      {
        title: t('achievements.mindfulness'),
        theme: 'green',
        badges: allBadges.filter(b => mindfulnessKeys.includes(b.label)).filter(filterFn),
      },
      {
        title: t('achievements.level'),
        theme: 'purple',
        badges: allBadges.filter(b => levelKeys.includes(b.label)).filter(filterFn),
      }
    ].filter(c => c.badges.length > 0);
  }, [allBadges, filter, t]);

  const [featuredBadge, setFeaturedBadge] = useState<Badge | null>(null);
  const [viewedBadge, setViewedBadge] = useState<Badge | null>(null);

  // Set a dynamically featured badge every time the screen comes into focus. 
  useFocusEffect(
    useCallback(() => {
      // 1. Prioritize any earned badge that has NOT been claimed yet
      const unclaimed = allBadges.filter(b => b.earned && !b.claimed);
      if (unclaimed.length > 0) {
        setFeaturedBadge(unclaimed[0]);
        return;
      }
      
      // 2. Otherwise, randomize among rare/epic/legendary badges you own
      const highRarity = allBadges.filter(b => b.earned && ['rare', 'epic', 'legendary'].includes(b.rarity));
      if (highRarity.length > 0) {
        setFeaturedBadge(highRarity[Math.floor(Math.random() * highRarity.length)]);
        return;
      }
      
      // 3. Fallback to any earned badge
      const earned = allBadges.filter(b => b.earned);
      if (earned.length > 0) {
        setFeaturedBadge(earned[Math.floor(Math.random() * earned.length)]);
        return;
      }

      // 4. Fallback to just anything
      setFeaturedBadge(allBadges[0]);
    }, [allBadges])
  );

  const [claimingLabel, setClaimingLabel] = useState<string | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handleClaim = (label: string) => {
    setClaimingLabel(label);
    
    scaleAnim.setValue(1);
    rotateAnim.setValue(0);
        Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 350,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        })
      ]),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(rotateAnim, {
          toValue: 0,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        })
      ])
    ]).start(() => {
      claimBadge(label);
      setClaimingLabel(null);
    });
  };

  const popTransform = {
    transform: [
      { scale: scaleAnim },
      { rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '15deg'] }) }
    ]
  };

  const displayFeatured = featuredBadge || allBadges[0];

  const rarityColor = useMemo(() => {
    if (!displayFeatured) return colors.primary;
    switch (displayFeatured.rarity) {
      case 'common': return colors.textSecondary;
      case 'rare': return colors.primary;
      case 'epic': return colors.accent;
      case 'legendary': return '#F59E0B';
      default: return colors.primary;
    }
  }, [displayFeatured]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return colors.textSecondary;
      case 'rare': return colors.primary;
      case 'epic': return colors.accent;
      case 'legendary': return '#F59E0B';
      default: return colors.primary;
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
            {/* Header Sticky */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <MaterialCommunityIcons name="trophy" size={32} color={colors.primary} />
          <Text style={s.headerTitle}>{t('achievements.title')}</Text>
        </View>
        <View style={s.xpPill}>
          <MaterialCommunityIcons name="star-circle" size={16} color={colors.primary} />
          <Text style={s.xpText}>{stats.ecoPoints.toLocaleString()}</Text>
          <Text style={s.xpLabel}>XP</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                {/* Featured Achievement (Rare) */}
        {displayFeatured && (
          <View style={[gs.featureCard, displayFeatured.earned && gs.neonGlowGreenCard]}>
            <View style={s.featureGlow} />
            <View style={s.featureRow}>
              <Animated.View style={claimingLabel === displayFeatured.label ? popTransform : {}}>
                {displayFeatured.earned ? (
                  <LinearGradient colors={[colors.primary, '#00d1ff']} style={s.featureIconBg}>
                    <MaterialCommunityIcons name={displayFeatured.icon as any} size={48} color="#FFF" />
                  </LinearGradient>
                ) : (
                  <View style={[s.featureIconBg, { backgroundColor: colors.surface }]}>
                    <MaterialCommunityIcons name={displayFeatured.icon as any} size={48} color={colors.textMuted} />
                  </View>
                )}
              </Animated.View>
                          <View style={s.featureContent}>
                <View style={s.featureTagRow}>
                  <View style={[s.rareTag, { backgroundColor: rarityColor + '20' }]}>
                    <Text style={[s.rareTagText, { color: rarityColor }]}>
                      {t(`rarity.${displayFeatured.rarity}`)}
                    </Text>
                  </View>
                  {displayFeatured.earned && (
                    <Text style={s.unlockedTime}>{t('achievements.unlockedAgo')} 2h</Text>
                  )}
                </View>
                <Text style={[s.featureTitle, !displayFeatured.earned && s.textMuted]} numberOfLines={1} adjustsFontSizeToFit>
                  {t(displayFeatured.label)}
                </Text>
                <Text style={s.featureDesc}>
                  {t(`${displayFeatured.label}Desc`)}
                </Text>
                {displayFeatured.earned && !displayFeatured.claimed && (
                  <TouchableOpacity 
                    style={[s.claimBtn, claimingLabel === displayFeatured.label && { opacity: 0.5 }]} 
                    activeOpacity={0.8} 
                    onPress={() => handleClaim(displayFeatured.label)}
                    disabled={claimingLabel === displayFeatured.label}
                  >
                    <Text style={s.claimBtnText}>{t('achievements.claimReward')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Milestone Progress */}
        <View style={[gs.card, s.milestoneCard]}>
          <View style={s.milestoneTop}>
            <View>
              <Text style={s.milestoneLevel}>Level {stats.level} {stats.title}</Text>
              <Text style={s.milestoneRank}>{t('achievements.masterRank')}</Text>
            </View>
            <Text style={s.milestonePct}>{Math.round(stats.progressPct)}% {t('achievements.completed')}</Text>
          </View>
                    <View style={s.milestoneTrack}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.milestoneFill, { width: `${stats.progressPct}%` }]}
            />
          </View>
                    <View style={s.infoRow}>
            <MaterialCommunityIcons name="information" size={14} color={colors.textSecondary} />
            <Text style={s.infoText}>
              Earn {stats.ptnl} more XP to level up to {levelTitle(stats.level + 1)}.
            </Text>
          </View>
        </View>

        {/* Digital Zen Garden Bento Grid */}
        <View style={s.bentoSection}>
          <View style={s.bentoHeader}>
            <Text style={s.bentoTitle}>{t('achievements.digitalZenGarden')}</Text>
            <View style={s.filterBtns}>
              <TouchableOpacity
                onPress={() => setFilter('all')}
                style={[s.filterBtn, filter === 'all' ? s.filterActive : s.filterInactive]}
              >
                <Text style={filter === 'all' ? s.filterActiveText : s.filterInactiveText}>
                  {t('achievements.all')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilter('locked')}
                style={[s.filterBtn, filter === 'locked' ? s.filterActive : s.filterInactive]}
              >
                <Text style={filter === 'locked' ? s.filterActiveText : s.filterInactiveText}>
                  {t('achievements.locked')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {categories.map((cat, i) => (
            <View key={i} style={s.categoryBlock}>
              <Text style={[s.categoryTitle, { color: cat.theme === 'purple' ? colors.accent : colors.primary }]}>
                {cat.title}
              </Text>
              <View style={s.grid}>
                {cat.badges.map((b, j) => (
                  <BadgeCard 
                    key={j} 
                    icon={b.icon} 
                    label={b.label} 
                    earned={b.earned} 
                    claimed={b.claimed}
                    isPurple={cat.theme === 'purple'} 
                    onPress={() => setViewedBadge(b)}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Badge Details Modal */}
      <Modal visible={!!viewedBadge} transparent animationType="fade" onRequestClose={() => setViewedBadge(null)}>
        <Pressable style={s.modalOverlay} onPress={() => setViewedBadge(null)}>
          {viewedBadge && (
            <Pressable style={s.modalContent} onPress={e => e.stopPropagation()}>
              <View style={[s.modalHeader, { backgroundColor: getRarityColor(viewedBadge.rarity) + '10' }]}>
                <Animated.View style={claimingLabel === viewedBadge.label ? popTransform : {}}>
                  {viewedBadge.earned ? (
                     <LinearGradient colors={[colors.primary, '#00d1ff']} style={s.modalIconBg}>
                       <MaterialCommunityIcons name={viewedBadge.icon as any} size={48} color="#FFF" />
                     </LinearGradient>
                  ) : (
                     <View style={[s.modalIconBg, { backgroundColor: colors.surface }]}>
                       <MaterialCommunityIcons name={viewedBadge.icon as any} size={48} color={colors.textMuted} />
                     </View>
                  )}
                </Animated.View>
                <View style={[s.rareTag, s.modalRarity, { backgroundColor: getRarityColor(viewedBadge.rarity) + '20' }]}>
                  <Text style={[s.rareTagText, { color: getRarityColor(viewedBadge.rarity) }]}>
                    {t(`rarity.${viewedBadge.rarity}`)}
                  </Text>
                </View>
              </View>

              <View style={s.modalBody}>
                <Text style={s.modalTitle}>{t(viewedBadge.label)}</Text>
                <Text style={s.modalDesc}>{t(`${viewedBadge.label}Desc`)}</Text>
                
                {viewedBadge.earned && !viewedBadge.claimed ? (
                  <TouchableOpacity 
                    style={[s.claimBtn, { width: '100%', alignItems: 'center', marginBottom: spacing.md }, claimingLabel === viewedBadge.label && { opacity: 0.5 }]} 
                    activeOpacity={0.8} 
                    onPress={() => handleClaim(viewedBadge.label)}
                    disabled={claimingLabel === viewedBadge.label}
                  >
                    <Text style={s.claimBtnText}>{t('achievements.claimReward')}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={s.modalStatusBox}>
                    <MaterialCommunityIcons 
                      name={viewedBadge.earned ? "check-circle" : "lock"} 
                      size={20} 
                      color={viewedBadge.earned ? colors.primary : colors.textMuted} 
                    />
                    <Text style={[s.modalStatusText, viewedBadge.earned ? { color: colors.primary } : { color: colors.textMuted }]}>
                      {viewedBadge.earned ? t('achievements.unlocked_toast') : t('achievements.locked')}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={s.modalCloseBtn} onPress={() => setViewedBadge(null)}>
                <Text style={s.modalCloseText}>{t('stats.streakModalClose')}</Text>
              </TouchableOpacity>
            </Pressable>
          )}
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

/* ── Styles ───────────────────────────────────────────────────────────────── */

const gs = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.xl,
  },
  neonGlowGreenCard: {
    borderColor: 'rgba(0, 245, 159, 0.4)',
    backgroundColor: 'rgba(0, 245, 159, 0.05)',
  },
  neonGlowPurpleCard: {
    borderColor: 'rgba(187, 134, 252, 0.4)',
    backgroundColor: 'rgba(187, 134, 252, 0.05)',
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 159, 0.2)',
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.xl,
  },
  bentoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 159, 0.15)',
    borderRadius: 20,
    padding: spacing.md,
    alignItems: 'center',
    width: (width - spacing.lg * 2 - spacing.sm * 2) / 3.2,
    gap: spacing.xs,
  },
  lockedCard: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.5,
  },
  clayIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shadowPurple: {
    shadowColor: colors.accent,
  },
  lockedIconBg: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoLabel: {
    fontSize: 10,
    color: '#E2E8F0',
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  unclaimedDot: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  lockedLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
  }
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 100 },
  textMuted: { color: colors.textMuted },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(15, 17, 21, 0.8)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.text },
  xpPill: {
    ...gs.card,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderColor: 'rgba(0, 245, 159, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpText: { ...typography.bodyBold, color: colors.primary },
  xpLabel: { ...typography.small, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },

  /* Featured */
  featureGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    backgroundColor: 'rgba(0, 245, 159, 0.1)',
    borderRadius: 75,
  },
  featureRow: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  featureIconBg: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  featureContent: { flex: 1 },
  featureTagRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  rareTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rareTagText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  unlockedTime: { fontSize: 10, color: colors.textSecondary, fontStyle: 'italic' },
  featureTitle: { ...typography.h2, color: colors.text, marginBottom: 4 },
  featureDesc: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 20 },
  claimBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  claimBtnText: { ...typography.caption, fontWeight: '700', color: colors.background },

  /* Milestone */
  milestoneCard: {
    padding: spacing.lg,
    borderColor: '#1E293B',
    marginBottom: spacing.xl,
  },
  milestoneTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.md },
  milestoneLevel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: -0.5 },
  milestoneRank: { ...typography.h3, color: colors.text },
  milestonePct: { ...typography.caption, fontWeight: '500', color: colors.primary },
  milestoneTrack: { height: 12, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 6, overflow: 'hidden', marginBottom: spacing.md },
  milestoneFill: { height: '100%', borderRadius: 6, position: 'relative' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, color: colors.textSecondary },

  /* Bento Grid */
  bentoSection: { gap: spacing.xl },
  bentoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bentoTitle: { ...typography.h2, color: colors.text },
  filterBtns: { flexDirection: 'row', gap: spacing.sm },
  filterBtn: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full },
  filterActive: { backgroundColor: colors.primary },
  filterInactive: { ...gs.card, borderWidth: 0 },
  filterActiveText: { fontSize: 12, fontWeight: '600', color: colors.background },
  filterInactiveText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  categoryBlock: { gap: spacing.md, marginBottom: spacing.md },
  categoryTitle: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'flex-start' },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalIconBg: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalRarity: {
    marginTop: 8,
    alignSelf: 'center',
  },
  modalBody: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  modalStatusText: {
    fontWeight: '700',
    fontSize: 14,
  },
  modalCloseBtn: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    padding: spacing.lg,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#E2E8F0',
    fontWeight: '600',
    fontSize: 16,
  }
});
