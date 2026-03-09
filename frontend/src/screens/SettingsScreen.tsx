import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, StatusBar, Alert, Platform,
} from 'react-native';
import { useWelcome } from '../contexts/WelcomeContext';
import { useHabits, calcEcoPoints, calcLevel, levelTitle } from '../contexts/HabitContext';
import { colors, spacing, typography, radius, glassCard } from '../theme';
import { useI18n } from '../contexts/I18nContext';

const APP_VERSION = '1.1.0';

export default function SettingsScreen() {
  const { resetOnboarding, userName, setUserName } = useWelcome();
  const { habits } = useHabits();
  const { locale, setLocale, t } = useI18n();
  const [nameInput, setNameInput] = useState(userName);
  const [saved, setSaved] = useState(false);

  const ecoPoints = calcEcoPoints(habits);
  const level = calcLevel(ecoPoints);
  const title = levelTitle(level);

  const handleSave = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await setUserName(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetOnboarding = () => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(t('settings.replayConfirm'));
      if (ok) resetOnboarding();
    } else {
      Alert.alert(t('settings.viewTutorialTitle'), t('settings.replayConfirm'), [
        { text: t('settings.cancel'), style: 'cancel' },
        { text: t('settings.yes'), onPress: () => resetOnboarding() },
      ]);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <View style={s.profileCard}>
          <View style={s.orbSmall}>
            <Text style={{ fontSize: 32 }}>🌿</Text>
          </View>
          <Text style={s.profileName}>{userName || 'User'}</Text>
          <View style={s.levelBadge}>
            <Text style={s.levelBadgeText}>⚡ Level {level} • {title}</Text>
          </View>
          <Text style={s.ecoPoints}>{ecoPoints.toLocaleString()} Eco Points</Text>
        </View>

        {/* Edit name */}
        <Text style={s.secTitle}>{t('settings.profile')}</Text>
        <View style={s.card}>
          <Text style={s.label}>{t('settings.yourName')}</Text>
          <TextInput
            style={s.input}
            value={nameInput}
            onChangeText={(t_) => { setNameInput(t_); setSaved(false); }}
            placeholder={t('settings.namePlaceholder')}
            placeholderTextColor={colors.textMuted}
            maxLength={30}
            accessibilityLabel="Display name"
          />
          <TouchableOpacity
            style={[s.saveBtn, saved && s.saveBtnDone]}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Name saved' : 'Save name'}
          >
            <Text style={s.saveTxt}>{saved ? t('settings.saved') : t('settings.save')}</Text>
          </TouchableOpacity>
        </View>

        {/* App section */}
        <Text style={s.secTitle}>{t('settings.app')}</Text>
        <View style={s.card}>
          <TouchableOpacity
            style={s.rowItem}
            onPress={handleResetOnboarding}
            accessibilityRole="button"
            accessibilityLabel={t('settings.viewTutorial')}
          >
            <Text style={s.rowIcon}>📖</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>{t('settings.viewTutorial')}</Text>
              <Text style={s.rowSub}>{t('settings.viewTutorialDesc')}</Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.rowItem}
            onPress={() => setLocale(locale === 'en' ? 'es' : 'en')}
            accessibilityRole="button"
            accessibilityLabel={t('settings.language')}
          >
            <Text style={s.rowIcon}>🌐</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>{t('settings.language')}</Text>
              <Text style={s.rowSub}>{t('settings.languageDesc')}</Text>
            </View>
            <Text style={s.langValue}>{locale === 'en' ? 'English' : 'Español'}</Text>
          </TouchableOpacity>
          <View style={[s.rowItem, { borderBottomWidth: 0 }]}>
            <Text style={s.rowIcon}>ℹ️</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>{t('settings.version')}</Text>
              <Text style={s.rowSub}>EcoHabit v{APP_VERSION}</Text>
            </View>
          </View>
        </View>

        {/* About */}
        <Text style={s.secTitle}>{t('settings.about')}</Text>
        <View style={s.card}>
          <View style={s.aboutBody}>
            <Text style={{ fontSize: 40, marginBottom: spacing.sm }}>🌱</Text>
            <Text style={s.aboutTitle}>EcoHabit</Text>
            <Text style={s.aboutText}>
              {t('settings.aboutText')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 40 },

  // Profile card
  profileCard: {
    ...glassCard,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  orbSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryDim,
    borderWidth: 2,
    borderColor: colors.accent + '60',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  profileName: { ...typography.h3, color: colors.text, marginBottom: 6 },
  levelBadge: {
    backgroundColor: colors.accentDim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.accent + '44',
  },
  levelBadgeText: { ...typography.caption, color: colors.accent, fontWeight: '700' },
  ecoPoints: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  // Section title
  secTitle: {
    ...typography.small,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: 2,
  },

  // Glass cards
  card: { ...glassCard, overflow: 'hidden', marginBottom: spacing.lg },

  // Name input
  label: { ...typography.small, color: colors.textSecondary, padding: spacing.md, paddingBottom: 4 },
  input: {
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    margin: spacing.md,
    marginTop: 0,
    backgroundColor: colors.surfaceLight,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBtnDone: { backgroundColor: colors.accent },
  saveTxt: { ...typography.bodyBold, color: colors.background },

  // Row items
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    gap: spacing.sm,
  },
  rowIcon: { fontSize: 20, width: 28 },
  rowLabel: { ...typography.bodyBold, color: colors.text },
  rowSub: { ...typography.small, color: colors.textMuted },
  chevron: { fontSize: 22, color: colors.textMuted },
  langValue: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  // About
  aboutBody: { alignItems: 'center', padding: spacing.xl },
  aboutTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  aboutText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
