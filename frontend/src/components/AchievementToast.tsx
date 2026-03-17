import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, glassCard, spacing, radius } from '../theme';
import { useI18n } from '../contexts/I18nContext';

interface Props {
  icon: string;
  label: string;
  visible: boolean;
  onHide: () => void;
}

export default function AchievementToast({ icon, label, visible, onHide }: Props) {
  const { t } = useI18n();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // We should fetch the translation for the label since it's passed as a translation key
  const title = t(label) || label;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -120, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => onHide());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[s.container, { transform: [{ translateY }], opacity }]}>
      <View style={s.glow} />
      <View style={s.card}>
        <View style={s.iconWrap}>
            <MaterialCommunityIcons name={icon as any} size={36} color={colors.accent} />
        </View>
        <View style={s.textWrap}>
          <Text style={s.title}>{t('achievements.unlocked_toast')}</Text>
          <Text style={s.label}>{title}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: -10,
    left: '20%',
    right: '20%',
    height: 40,
    backgroundColor: colors.primary,
    opacity: 0.15,
    borderRadius: 20,
    // blur simulated via opacity
  },
  card: {
    ...glassCard,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(187, 134, 252, 0.08)',
    borderColor: 'rgba(187, 134, 252, 0.3)',
    width: '100%',
  },
  iconWrap: {
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  label: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
});
