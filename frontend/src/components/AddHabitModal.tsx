import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';
import { colors, glassCard, spacing, radius } from '../theme';
import { useI18n } from '../contexts/I18nContext';

const ICON_OPTIONS = ['🌱', '💧', '🏋️', '💻', '🧘', '📖', '🎵', '🍎', '🚶', '💤', '🧹', '✍️'];
const COLOR_OPTIONS = ['#2ECC71', '#3498DB', '#E74C3C', '#F39C12', '#9B59B6', '#1ABC9C', '#BB86FC', '#00f59f'];
const DEFAULT_ICON = '🌱';

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; icon: string; color: string; goal?: string }) => Promise<void>;
  editMode?: boolean;
  initialData?: { name: string; icon: string; color: string; goal?: string };
}

export default function AddHabitModal({ visible, onClose, onAdd, editMode, initialData }: AddHabitModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editMode && initialData) {
        setName(initialData.name);
        setGoal(initialData.goal ?? '');
        setSelectedIcon(initialData.icon);
        setSelectedColor(initialData.color);
      } else {
        setName('');
        setGoal('');
        setSelectedIcon(null);
        setSelectedColor(COLOR_OPTIONS[0]);
      }
      setError('');
    }
  }, [visible, editMode, initialData]);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError(t('addHabit.nameEmpty')); return; }
    setError('');
    setLoading(true);
    try {
      await onAdd({
        name: trimmed,
        icon: selectedIcon ?? DEFAULT_ICON,
        color: selectedColor,
        goal: goal.trim() || undefined,
      });
      setName(''); setGoal(''); setSelectedIcon(null); setSelectedColor(COLOR_OPTIONS[0]);
      onClose();
    } catch {
      Alert.alert(t('errors.error'), editMode ? t('addHabit.errorUpdate') : t('addHabit.errorCreate'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{editMode ? t('addHabit.editHabit') : t('addHabit.newHabit')}</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.input}
              placeholder={t('addHabit.namePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={(txt) => { setName(txt); setError(''); }}
              editable={!loading}
              autoFocus
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TextInput
              style={styles.input}
              placeholder={t('addHabit.goalPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={goal}
              onChangeText={setGoal}
              editable={!loading}
            />

            <Text style={styles.label}>{t('addHabit.icon')}</Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  testID={`icon-${icon}`}
                  style={[
                    styles.iconButton,
                    selectedIcon === icon && styles.iconSelected,
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t('addHabit.color')}</Text>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  testID={`color-${c}`}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    selectedColor === c && styles.colorSelected,
                  ]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>{t('addHabit.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmText}>{editMode ? t('addHabit.save') : t('addHabit.create')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: 40,
    borderWidth: glassCard.borderWidth,
    borderColor: glassCard.borderColor,
    borderBottomWidth: 0,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: spacing.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  iconText: {
    fontSize: 24,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: spacing.xl,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.md,
  },
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radius.md,
    minWidth: 90,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
