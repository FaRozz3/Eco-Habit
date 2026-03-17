import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Alert, Platform, Image, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useWelcome } from '../contexts/WelcomeContext';
import { colors, spacing, typography, radius } from '../theme';
import { useI18n } from '../contexts/I18nContext';

export default function SettingsScreen() {
  const { resetOnboarding, userName, avatarUri, setAvatarUri } = useWelcome();
  const { locale, setLocale, t } = useI18n();
  const navigation = useNavigation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleResetOnboarding = () => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(t('settings.replayConfirm') || 'Replay tutorial?');
      if (ok) resetOnboarding();
    } else {
      Alert.alert(t('settings.viewTutorialTitle') || 'Tutorial', t('settings.replayConfirm') || 'Replay tutorial?', [
        { text: t('settings.cancel') || 'Cancel', style: 'cancel' },
        { text: t('settings.yes') || 'Yes', onPress: () => resetOnboarding() },
      ]);
    }
  };

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'es' : 'en');
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('achievements.settings') || 'Settings'}</Text>
        <TouchableOpacity style={s.headerBtn}>
          <MaterialCommunityIcons name="help-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile Section */}
        <View style={s.profileSection}>
          <View style={s.avatarContainer}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              style={s.avatarGlowRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <TouchableOpacity style={s.avatarInner} onPress={pickImage} activeOpacity={0.8}>
                <Image 
                  source={{ uri: avatarUri || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHI_N2WHQ1FfYjSmFSKGhJNNBW8Suqxdmxr-HEoZmcaRKsIK9coMyWWBL0WaZg59cPFOCwrVp-yo4bFq1m7paat1ve_9HhzYyShjIhws5-a3kamggAi5B1DDqpWgCgDsFwu4U5jnT36HO46IT3VwYhwmuQYXDV_zX-RtJKKCFmn2uPJi02OblzPIYxtbJzL-X-lNnY70lKUetNPpF_6mLEFOgB2M8u3fFZgkcrzl-Xi1a9QByJOx3p-sul6uomR58Z2DFtxm9D1V0' }} 
                  style={s.avatarImage} 
                />
              </TouchableOpacity>
            </LinearGradient>
            <View style={s.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={16} color={colors.background} style={s.verifiedIcon} />
            </View>
          </View>
          <Text style={s.profileName}>{userName || 'Eco Warrior'}</Text>
          <View style={s.premiumBadge}>
            <MaterialCommunityIcons name="shield-star" size={14} color={colors.primary} />
            <Text style={s.premiumText}>PREMIUM MEMBER</Text>
          </View>
        </View>

        {/* Bento Grid Settings */}
        <View style={s.bentoGrid}>
          
          {/* Row 1: Language & Security */}
          <View style={s.bentoRow}>
            {/* Language */}
            <TouchableOpacity style={[s.glassCard, s.bentoHalfCard]} activeOpacity={0.7} onPress={toggleLanguage}>
              <View style={s.halfCardTop}>
                <MaterialCommunityIcons name="web" size={28} color={colors.primary} />
                <View style={s.langChip}>
                  <Text style={s.langChipText}>{locale === 'en' ? 'EN' : 'ES'}</Text>
                </View>
              </View>
              <View>
                <Text style={s.cardLabel}>{t('settings.languageDesc') || 'Language'}</Text>
                <Text style={s.cardTitle}>{locale === 'en' ? 'English (US)' : 'Español'}</Text>
              </View>
            </TouchableOpacity>

            {/* Security */}
            <TouchableOpacity style={[s.glassCard, s.bentoHalfCard]} activeOpacity={0.7}>
              <View style={s.halfCardTop}>
                <MaterialCommunityIcons name="shield-account-outline" size={28} color={colors.primary} />
              </View>
              <View>
                <Text style={s.cardLabel}>Account</Text>
                <Text style={s.cardTitle}>Security</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Notifications (Large) */}
          <View style={[s.glassCard, s.bentoFullCard]}>
            <View style={s.fullCardLeft}>
              <View style={s.iconBoxGreen}>
                <MaterialCommunityIcons name="bell-ring-outline" size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={s.cardTitle}>Notifications</Text>
                <Text style={s.cardLabel}>Manage alerts and sounds</Text>
              </View>
            </View>
            <Switch 
              value={notificationsEnabled} 
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(0, 245, 159, 0.4)' }}
              thumbColor={notificationsEnabled ? colors.primary : '#ccc'}
            />
          </View>

          {/* Watch Tutorial */}
          <TouchableOpacity style={[s.glassCard, s.bentoFullCard, s.tutorialCard]} activeOpacity={0.8} onPress={handleResetOnboarding}>
            <View style={s.fullCardLeft}>
              <View style={s.iconBoxPurple}>
                <MaterialCommunityIcons name="play-circle-outline" size={24} color={colors.accent} />
              </View>
              <View>
                <Text style={s.cardTitle}>{t('settings.viewTutorial') || 'Watch Tutorial'}</Text>
                <Text style={s.cardLabel}>{t('settings.viewTutorialDesc') || 'Master EcoHabit features'}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={26} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Row 3: Privacy & Log Out */}
          <View style={s.bentoRow}>
            {/* Privacy Policy */}
            <TouchableOpacity style={[s.glassCard, s.bentoHalfCard]} activeOpacity={0.7}>
              <View style={s.halfCardTop}>
                <MaterialCommunityIcons name="shield-check-outline" size={28} color={colors.primary} />
              </View>
              <View>
                <Text style={s.cardLabel}>Privacy</Text>
                <Text style={s.cardTitle}>Policy</Text>
              </View>
            </TouchableOpacity>

            {/* Log Out */}
            <TouchableOpacity style={[s.glassCard, s.bentoHalfCard, s.logoutCard]} activeOpacity={0.7}>
              <View style={s.halfCardTop}>
                <MaterialCommunityIcons name="logout" size={28} color="#F87171" style={s.logoutIcon} />
              </View>
              <View>
                <Text style={s.logoutLabel}>Session</Text>
                <Text style={s.logoutTitle}>Log Out</Text>
              </View>
            </TouchableOpacity>
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 100 },
  
  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    fontSize: 20,
    letterSpacing: -0.5,
  },

  /* Profile Section */
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatarGlowRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
    borderWidth: 4,
    borderColor: colors.background,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedIcon: {
    marginTop: 1, // Visual center tweak
  },
  profileName: {
    ...typography.h1,
    fontSize: 24,
    color: colors.text,
    marginBottom: 6,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    opacity: 0.8,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 1,
  },

  /* Bento Grid */
  bentoGrid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.15)',
    borderRadius: 20,
    padding: spacing.lg,
  },
  bentoHalfCard: {
    flex: 1,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  bentoFullCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  /* Internal Card Elements */
  halfCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  langChip: {
    backgroundColor: 'rgba(0, 245, 159, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  langChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  cardLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 2,
  },
  cardTitle: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.text,
  },

  /* Full Card List Items */
  fullCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  iconBoxGreen: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0, 245, 159, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxPurple: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorialCard: {
    // optional extra hover/active styles
  },

  /* Log Out Card styling */
  logoutCard: {
    borderColor: 'rgba(248, 113, 113, 0.2)',
    backgroundColor: 'rgba(248, 113, 113, 0.05)',
  },
  logoutIcon: {
    shadowColor: '#F87171',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  logoutLabel: {
    fontSize: 12,
    color: 'rgba(248, 113, 113, 0.6)',
    fontWeight: '500',
    marginBottom: 2,
  },
  logoutTitle: {
    ...typography.bodyBold,
    fontSize: 14,
    color: '#F87171',
  },
});
