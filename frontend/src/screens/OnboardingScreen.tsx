import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useWelcome } from '../contexts/WelcomeContext';
import { useI18n } from '../contexts/I18nContext';
import { colors, spacing, typography, glassCard } from '../theme';

const SLIDE_KEYS = [
  { icon: '🌿', titleKey: 'onboarding.slide1.title', bodyKey: 'onboarding.slide1.body' },
  { icon: '➕', titleKey: 'onboarding.slide2.title', bodyKey: 'onboarding.slide2.body' },
  { icon: '🔥', titleKey: 'onboarding.slide3.title', bodyKey: 'onboarding.slide3.body' },
  { icon: '⚡', titleKey: 'onboarding.slide4.title', bodyKey: 'onboarding.slide4.body' },
  { icon: '🏆', titleKey: 'onboarding.slide5.title', bodyKey: 'onboarding.slide5.body' },
  { icon: '🚀', titleKey: 'onboarding.slide6.title', bodyKey: 'onboarding.slide6.body' },
];

export default function OnboardingScreen() {
  const { markOnboardingDone } = useWelcome();
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const goTo = (index: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrent(index);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const next = () => {
    if (current < SLIDE_KEYS.length - 1) {
      goTo(current + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.93, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }),
    ]).start(() => markOnboardingDone());
  };

  const slideData = SLIDE_KEYS[current];
  const isLast = current === SLIDE_KEYS.length - 1;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Skip button — hidden on last slide */}
      {!isLast ? (
        <TouchableOpacity
          style={s.skip}
          onPress={handleFinish}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.skip')}
        >
          <Text style={s.skipTxt}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      ) : (
        <View style={s.skipPlaceholder} />
      )}

      {/* Slide content */}
      <Animated.View style={[s.content, { opacity: fadeAnim }]}>
        <View style={s.orbOuter}>
          <View style={s.orbGlow} />
          <View style={s.orb}>
            <Text style={s.orbIcon}>{slideData.icon}</Text>
          </View>
        </View>

        <Text style={s.title}>{t(slideData.titleKey)}</Text>
        <Text style={s.body}>{t(slideData.bodyKey)}</Text>
      </Animated.View>

      {/* Navigation dots */}
      <View style={s.dots}>
        {SLIDE_KEYS.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)} accessibilityLabel={`Go to slide ${i + 1}`}>
            <View
              style={[
                s.dot,
                i === current && s.dotActive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Action button */}
      <Animated.View style={[s.btnWrap, { transform: [{ scale: btnScale }] }]}>
        <TouchableOpacity
          style={[s.btn, isLast && s.btnLast]}
          onPress={next}
          accessibilityRole="button"
          accessibilityLabel={isLast ? t('onboarding.start') : t('onboarding.next')}
        >
          <Text style={s.btnTxt}>{isLast ? t('onboarding.start') : t('onboarding.next')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  skip: {
    alignSelf: 'flex-end',
    padding: spacing.lg,
  },
  skipPlaceholder: {
    height: 48 + spacing.lg,
  },
  skipTxt: {
    ...typography.body,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  orbOuter: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  orbGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.accentGlow,
    opacity: 0.4,
  },
  orb: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glassCard.backgroundColor,
    borderWidth: glassCard.borderWidth,
    borderColor: glassCard.borderColor,
    borderRadius: 70,
  },
  orbIcon: {
    fontSize: 64,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.primary,
  },
  btnWrap: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  btn: {
    ...glassCard,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnLast: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  btnTxt: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 17,
  },
});
