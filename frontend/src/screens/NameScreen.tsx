import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWelcome } from '../contexts/WelcomeContext';
import { useI18n } from '../contexts/I18nContext';
import { colors, glassCard, spacing, radius, gradient } from '../theme';

let MaskedView: any = null;
try {
  if (Platform.OS !== 'web') {
    MaskedView = require('@react-native-masked-view/masked-view').default;
  }
} catch {}


export default function NameScreen() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { setUserName } = useWelcome();
  const { t } = useI18n();

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('name.error'));
      return;
    }
    setError('');
    await setUserName(trimmed);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>🌿</Text>

        {MaskedView ? (
          <MaskedView
            maskElement={<Text style={styles.appNameMask}>EcoHabit</Text>}
          >
            <LinearGradient
              colors={[gradient.start, gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.appNameMask, { opacity: 0 }]}>EcoHabit</Text>
            </LinearGradient>
          </MaskedView>
        ) : (
          <Text style={[styles.appNameMask, { color: colors.primary }]}>EcoHabit</Text>
        )}

        <Text style={styles.prompt}>{t('name.prompt')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('name.placeholder')}
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={(t_) => { setName(t_); if (error) setError(''); }}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleContinue}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, !name.trim() && styles.buttonDimmed]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{t('name.continue')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  appNameMask: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
  },
  prompt: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  input: {
    width: '100%',
    ...glassCard,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  error: {
    color: colors.error,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonDimmed: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
});
