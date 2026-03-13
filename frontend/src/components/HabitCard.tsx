import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { colors, spacing, radius } from '../theme';
import { useI18n } from '../contexts/I18nContext';

interface HabitCardProps {
  name: string;
  streak: number;
  completedToday: boolean;
  onCheck: () => void;
  onLongPress?: () => void;
  onOptionsPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  icon?: string;
  color?: string;
  goal?: string;
  reminderTime?: string;
  last7Days?: boolean[];
}

const DEFAULT_LAST_7_DAYS = [false, false, false, false, false, false, false];

/**
 * Maps emoji icons to simpler single-character symbols for a cleaner look.
 * Falls back to the first character of the icon string.
 */
const ICON_SYMBOL_MAP: Record<string, string> = {
  '🌱': '♣',
  '💧': '◆',
  '🏋️': '▲',
  '💻': '⬡',
  '🧘': '◎',
  '📖': '▤',
  '🎵': '♪',
  '🍎': '●',
  '🚶': '⬆',
  '💤': '◐',
  '🧹': '✦',
  '✍️': '✎',
};

function getSymbol(icon: string): string {
  return ICON_SYMBOL_MAP[icon] ?? icon.charAt(0);
}

export default function HabitCard({
  name,
  streak,
  completedToday,
  onCheck,
  onLongPress,
  onOptionsPress,
  onEdit,
  onDelete,
  icon = '🌱',
  color,
  goal,
  reminderTime,
  last7Days = DEFAULT_LAST_7_DAYS,
}: HabitCardProps) {
  const { t } = useI18n();
  const todayDotAnim = useRef(new Animated.Value(completedToday ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(todayDotAnim, {
      toValue: completedToday ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [completedToday, todayDotAnim]);

  const accentColor = color || colors.accent;
  const days = last7Days.length === 7 ? last7Days : DEFAULT_LAST_7_DAYS;
  const symbol = getSymbol(icon);

  const renderRightActions = () => {
    if (!onEdit && !onDelete) return null;

    return (
      <View style={styles.rightActionsContainer}>
        {onEdit && (
          <TouchableOpacity style={[styles.actionButton, styles.editAction]} onPress={onEdit}>
            <MaterialCommunityIcons name="pencil" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity style={[styles.actionButton, styles.deleteAction]} onPress={onDelete}>
            <MaterialCommunityIcons name="delete" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.cardWrapper}>
      <Swipeable
        renderRightActions={renderRightActions}
        containerStyle={styles.swipeableContainer}
        friction={2}
        enableTrackpadTwoFingerGesture
        rightThreshold={40}
      >
        <TouchableOpacity
          style={[styles.card, completedToday && styles.cardCompleted]}
          onPress={onCheck}
          onLongPress={onLongPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${name} as completed`}
        >
          {/* Icon circle */}
          <View style={[styles.iconCircle, { backgroundColor: accentColor + '18' }]}>
            <Text style={[styles.iconSymbol, { color: accentColor }]}>{symbol}</Text>
          </View>

          {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.subtextRow}>
          {goal ? <Text style={styles.goal}>{t('habit.goal')} {goal}</Text> : null}
          {reminderTime ? (
            <View style={styles.reminderBadge}>
              <MaterialCommunityIcons name="bell-ring" size={10} color={colors.primary} />
              <Text style={styles.reminderText}>{reminderTime}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.dotsRow}>
              {days.map((completed, index) => {
                const isToday = index === days.length - 1;
                if (isToday) {
                  const dotOpacity = todayDotAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 1],
                  });
                  return (
                    <Animated.View
                      key={index}
                      testID={`dot-${index}`}
                      style={[styles.dot, { backgroundColor: accentColor, opacity: dotOpacity }]}
                    />
                  );
                }
                return (
                  <View
                    key={index}
                    testID={`dot-${index}`}
                    style={[styles.dot, {
                      backgroundColor: accentColor,
                      opacity: completed ? 1 : 0.2,
                    }]}
                  />
                );
              })}
            </View>
          </View>

          {/* Streak and Options */}
          <View style={styles.rightContainer}>
            <View style={styles.streakContainer}>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakLabel}>{t('habit.dayStreak')}</Text>
            </View>

            {onOptionsPress && (
              <TouchableOpacity
                style={styles.optionsButton}
                onPress={onOptionsPress}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: spacing.sm + 2,
  },
  swipeableContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: 'rgba(187, 134, 252, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.12)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  cardCompleted: {
    borderColor: 'rgba(0, 245, 159, 0.2)',
    backgroundColor: 'rgba(0, 245, 159, 0.03)',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md + 2,
  },
  iconSymbol: {
    fontSize: 20,
    fontWeight: '700',
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  subtextRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: spacing.sm },
  goal: { fontSize: 12, color: colors.textSecondary },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 4,
  },
  reminderText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  streakContainer: { alignItems: 'flex-end' },
  streakNumber: { fontSize: 24, fontWeight: '700', color: colors.text },
  streakLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  optionsButton: {
    marginLeft: spacing.sm,
    padding: 4,
  },
  rightActionsContainer: {
    flexDirection: 'row',
    height: '100%',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    height: '100%',
  },
  editAction: {
    backgroundColor: colors.warning || '#F39C12', // using warning color, falling back to orange
  },
  deleteAction: {
    backgroundColor: colors.error,
  },
});
