import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, glassCard, spacing, gradient } from '../theme';
import { useI18n } from '../contexts/I18nContext';

interface DailyProgressProps {
  completed: number;
  total: number;
}

export default function DailyProgress({ completed, total }: DailyProgressProps) {
  const { t } = useI18n();
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const remaining = total - completed;

  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: pct,
      duration: 800,
      useNativeDriver: false, // Animating width requires useNativeDriver: false
    }).start();
  }, [pct, animatedWidth]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  const getSubtext = (): string => {
    if (total === 0) return t('dailyProgress.createFirst');
    if (remaining <= 0) return t('dailyProgress.allDone');
    return t('dailyProgress.remaining', { count: remaining });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('dailyProgress.title')}</Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
      <View style={styles.barBg}>
        <Animated.View style={[styles.barFillContainer, { width: widthInterpolated }]}>
          <LinearGradient
            colors={[gradient.start, gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.barFill}
          />
        </Animated.View>
      </View>
      <Text style={styles.subtext}>{getSubtext()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...glassCard,
    borderRadius: 24,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  pct: { fontSize: 16, fontWeight: '700', color: colors.primary },
  barBg: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    overflow: 'hidden',
    width: '100%',
  },
  barFillContainer: {
    height: '100%',
    borderRadius: 6,
  },
  barFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 6,
    shadowColor: '#00f59f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  subtext: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.md },
});
