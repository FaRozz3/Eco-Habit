import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { useWelcome } from '../contexts/WelcomeContext';
import { useI18n } from '../contexts/I18nContext';
import { colors, spacing, typography, radius, glassCard } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SLIDE_KEYS = [
  { 
    id: 1,
    titleKey: 'onboarding.slide1.title',
    bodyKey: 'onboarding.slide1.body',
    btnKey: 'onboarding.slide1.btn',
    levelKey: 'onboarding.seedlingInitiate'
  },
  { 
    id: 2,
    titleKey: 'onboarding.slide2.title',
    bodyKey: 'onboarding.slide2.body',
    btnKey: 'onboarding.slide2.btn',
    levelKey: 'onboarding.seedlingInitiate'
  },
  { 
    id: 3,
    titleKey: 'onboarding.slide3.title',
    bodyKey: 'onboarding.slide3.body',
    btnKey: 'onboarding.slide3.btn',
    levelKey: 'onboarding.seedlingInitiate'
  }
];

export default function OnboardingScreen() {
  const { markOnboardingDone } = useWelcome();
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current; // Horizontal slide
  const bounceAnim = useRef(new Animated.Value(0)).current; // For floating stats
  const btnScale = useRef(new Animated.Value(1)).current;

  // Floating animation for stats
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const goTo = (index: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(index);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
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

  // Helper to render title with primary color span
  const renderTitle = (text: string) => {
    const parts = text.split(/<primary>|<\/primary>/);
    return (
      <Text style={s.title}>
        {parts.map((part, i) => (
          i % 2 === 1 ? <Text key={i} style={{ color: colors.primary }}>{part}</Text> : part
        ))}
      </Text>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Mesh Gradient Background */}
      <View style={StyleSheet.absoluteFill}>
        <View style={s.bgDark} />
        <View style={[s.glowCircle, { top: '-10%', left: '10%', backgroundColor: 'rgba(0, 245, 159, 0.12)' }]} />
        <View style={[s.glowCircle, { bottom: '5%', right: '-10%', backgroundColor: 'rgba(187, 134, 252, 0.08)' }]} />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.logoWrap}>
            <View style={s.logoIcon}>
              <MaterialCommunityIcons name="leaf" size={20} color={colors.background} />
            </View>
            <Text style={s.logoText}>EcoHabit</Text>
          </View>
          <TouchableOpacity onPress={handleFinish}>
            <Text style={s.skipTxt}>{t('onboarding.skip') || 'SKIP'}</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[s.main, { opacity: fadeAnim }]}>
          {/* Hero Visual */}
          <View style={s.heroContainer}>
            <View style={s.heroGlow} />
            
            {/* Main Trophy Display */}
            <View style={s.trophyCard}>
              <MaterialCommunityIcons 
                name="shield-check" 
                size={80} 
                color={colors.primary} 
                style={s.trophyIcon}
              />
              <View style={s.heroIndicators}>
                <View style={s.indicatorActive} />
                <View style={s.indicatorInactive} />
                <View style={s.indicatorInactive} />
              </View>
            </View>

            {/* Floating Stats */}
            <Animated.View style={[s.statCard, s.statXP, { transform: [{ translateY: bounceAnim }] }]}>
              <View style={s.statIconBoxPurple}>
                <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.accent} />
              </View>
              <View>
                <Text style={s.statLabel}>{t('onboarding.impactXP')}</Text>
                <Text style={s.statValue}>+2,450</Text>
              </View>
            </Animated.View>

            <Animated.View style={[s.statCard, s.statBadge, { transform: [{ translateY: Animated.multiply(bounceAnim, -1) }] }]}>
              <View style={s.statIconBoxGreen}>
                <MaterialCommunityIcons name="medal-outline" size={14} color={colors.primary} />
              </View>
              <View>
                <Text style={s.statLabel}>{t('onboarding.badgeUnlocked')}</Text>
                <Text style={s.statValue}>{t('onboarding.forestGuardian')}</Text>
              </View>
            </Animated.View>
          </View>

          {/* Text Content */}
          <View style={s.textContent}>
            {renderTitle(t(slideData.titleKey))}
            <Text style={s.body}>{t(slideData.bodyKey)}</Text>
          </View>

          {/* Active Mission Card */}
          <View style={s.missionCardOuter}>
             <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                style={s.missionCardInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Image 
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPrAdg_VPc9oHHTsx68eHAHe0cNNhTEW5pvHSstZ6jxQx7iBfUnuUmURPTHbGco6p-wjXHz58GFhigHT_zMdG7TqYKHbn1um4gz0Skj8KO_2NpSsY1VTayBZg4UMyeIzWka_Va4vXBtzdyxF3H5pFa1dPWuuIM_lOgUtJL753LCVjuZXaIJqF7MpuHd1QBq0G16x_60j6u9o4Bio1KRqX1WQxmKiu4cVZ7TlxJ36BuDkVEOdk1rr_6BkJSHmV78-Rtah-88Eto-fU' }}
                  style={s.missionThumb}
                />
                <View style={s.missionInfo}>
                  <View style={s.missionHeader}>
                    <Text style={s.missionLabel}>{t('onboarding.activeMission')}</Text>
                    <Text style={s.missionPercent}>75% {t('onboarding.done')}</Text>
                  </View>
                  <Text style={s.missionTitle}>{t('onboarding.plantTrees')}</Text>
                  <View style={s.progressBarTrack}>
                    <View style={[s.progressBarFill, { width: '75%' }]} />
                  </View>
                </View>
             </LinearGradient>
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={s.footer}>
          {/* Progress Dots */}
          <View style={s.dots}>
            {SLIDE_KEYS.map((_, i) => (
              <View
                key={i}
                style={[
                  s.dot,
                  i === current && s.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Action Button */}
          <Animated.View style={{ transform: [{ scale: btnScale }], width: '100%' }}>
            <TouchableOpacity style={s.mainBtn} onPress={next} activeOpacity={0.9}>
              <Text style={s.mainBtnText}>{t(slideData.btnKey)}</Text>
              <MaterialCommunityIcons name="arrow-right" size={24} color={colors.background} />
            </TouchableOpacity>
          </Animated.View>

          <Text style={s.levelText}>{t(slideData.levelKey)}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1115' },
  bgDark: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0f1115' },
  glowCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.6,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    height: 60,
  },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 32,
    height: 32,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...typography.h2,
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  skipTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },

  main: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },

  /* Hero Visual */
  heroContainer: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
  },
  heroGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(0, 245, 159, 0.1)',
    filter: 'blur(40px)', // web only, will just be opaque on mobile unless using BlurView
  },
  trophyCard: {
    width: 220,
    height: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  trophyIcon: {
    textShadowColor: 'rgba(0, 245, 159, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  heroIndicators: {
    flexDirection: 'row',
    gap: 6,
    position: 'absolute',
    bottom: 24,
  },
  indicatorActive: { width: 24, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  indicatorInactive: { width: 24, height: 4, borderRadius: 2, backgroundColor: 'rgba(0, 245, 159, 0.2)' },

  /* Floating Stats */
  statCard: {
    position: 'absolute',
    padding: 12,
    backgroundColor: 'rgba(25, 25, 30, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 20,
  },
  statXP: { top: 20, right: -10, borderColor: 'rgba(0, 245, 159, 0.2)' },
  statBadge: { bottom: 30, left: -20 },
  statIconBoxPurple: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconBoxGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 245, 159, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: { fontSize: 8, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 },
  statValue: { fontSize: 13, fontWeight: '700', color: colors.text },

  /* Text Content */
  textContent: { alignItems: 'center', marginBottom: spacing.xl },
  title: {
    ...typography.h1,
    color: colors.text,
    fontSize: 40,
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 16,
    paddingHorizontal: 20,
  },

  /* Mission Card */
  missionCardOuter: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  missionCardInner: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  missionThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  missionInfo: { flex: 1 },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  missionLabel: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  missionPercent: { fontSize: 9, fontWeight: '700', color: colors.textMuted },
  missionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },

  /* Footer */
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)' },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowRadius: 4,
    shadowOpacity: 0.5,
  },
  mainBtn: {
    width: '100%',
    height: 64,
    backgroundColor: colors.primary,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  mainBtnText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '800',
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
