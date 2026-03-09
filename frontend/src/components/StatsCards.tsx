import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, glassCard, spacing } from '../theme';
import { useI18n } from '../contexts/I18nContext';

interface StatsCardsProps {
  totalStreak: number;
  ecoPoints: number;
  nextLevelPoints: number;
  weekChange: number;
}

function IconCircle({ bg, children }: { bg: string; children: React.ReactNode }) {
  return <View style={[styles.iconCircle, { backgroundColor: bg }]}>{children}</View>;
}

export default function StatsCards({ totalStreak, ecoPoints, nextLevelPoints, weekChange }: StatsCardsProps) {
  const { t } = useI18n();
  const isPositive = weekChange >= 0;
  const changeLabel = isPositive ? `+${weekChange}% ${t('statsCards.thisWeek')}` : `${weekChange}% ${t('statsCards.thisWeek')}`;

  return (
    <View style={styles.row}>
      {/* Total Streak */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>{t('statsCards.totalStreak')}</Text>
          <IconCircle bg="rgba(243, 156, 18, 0.15)">
            <Text style={[styles.iconSymbol, { color: '#F39C12' }]}>⚡</Text>
          </IconCircle>
        </View>
        <Text style={styles.bigNumber}>{totalStreak}</Text>
        <View style={styles.subtextRow}>
          <View style={[styles.trendDot, { backgroundColor: isPositive ? colors.primary : colors.error }]} />
          <Text style={[styles.subtextTrend, { color: isPositive ? colors.primary : colors.error }]}>
            {changeLabel}
          </Text>
        </View>
      </View>

      {/* Eco Points */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>{t('statsCards.ecoPoints')}</Text>
          <IconCircle bg="rgba(0, 245, 159, 0.15)">
            <View style={styles.globeIcon}>
              <View style={styles.globeOuter}>
                <View style={styles.globeLine} />
              </View>
            </View>
          </IconCircle>
        </View>
        <Text style={styles.bigNumber}>{ecoPoints.toLocaleString()}</Text>
        <Text style={styles.subtextMuted}>{t('statsCards.nextLevel')} {nextLevelPoints.toLocaleString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    ...glassCard,
    borderRadius: 20,
    padding: spacing.lg,
    height: 130,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSymbol: {
    fontSize: 16,
    lineHeight: 20,
  },
  bigNumber: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 38,
  },
  subtextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  subtextTrend: {
    fontSize: 11,
    fontWeight: '500',
  },
  subtextMuted: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  // Globe icon built with views
  globeIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  globeOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#00f59f',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  globeLine: {
    width: 16,
    height: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 159, 0.5)',
  },
});
