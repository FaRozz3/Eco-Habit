import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Switch, Animated, PanResponder, Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, glassCard, spacing, radius } from '../theme';
import { useI18n } from '../contexts/I18nContext';

const ICON_OPTIONS = ['🌱', '💧', '🏋️', '💻', '🧘', '📖', '🎵', '🍎', '🚶', '💤', '🧹', '✍️'];
const COLOR_OPTIONS = ['#2ECC71', '#3498DB', '#E74C3C', '#F39C12', '#9B59B6', '#1ABC9C', '#BB86FC', '#00f59f'];
const DEFAULT_ICON = '🌱';

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; icon: string; color: string; goal?: string; reminder_time?: string }) => Promise<void>;
  editMode?: boolean;
  initialData?: { name: string; icon: string; color: string; goal?: string; reminder_time?: string };
}

export default function AddHabitModal({ visible, onClose, onAdd, editMode, initialData }: AddHabitModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
<<<<<<< HEAD

=======
  
>>>>>>> fe28807f352b02c3b8496b8fe3c9663a8d64dffa
  // Gesture & Animation State
  const panY = React.useRef(new Animated.Value(0)).current;
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');

  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
<<<<<<< HEAD
      // Only capture if moving vertically and distance is significant (~20px)
      // This allows tap events for TextInput to pass through.
      return Math.abs(gestureState.dy) > 20;
=======
      // Only capture if moving vertically
      return Math.abs(gestureState.dy) > 5;
>>>>>>> fe28807f352b02c3b8496b8fe3c9663a8d64dffa
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy < 0) {
        // Stretching up (with resistance)
        panY.setValue(gestureState.dy * 0.2);
      } else {
        // Dragging down
        panY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 120 || gestureState.vy > 0.5) {
        // Closing gesture
        handleAnimateClose();
      } else {
        // Reset position
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
      }
    },
  }), []);

  const handleAnimateClose = () => {
    Animated.timing(panY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      panY.setValue(0);
    });
  };

  useEffect(() => {
    if (visible) {
      if (editMode && initialData) {
        setName(initialData.name);
        setGoal(initialData.goal ?? '');
        setSelectedIcon(initialData.icon);
        setSelectedColor(initialData.color);
        if (initialData.reminder_time) {
          setReminderEnabled(true);
          const [h, m] = initialData.reminder_time.split(':');
          const d = new Date();
          d.setHours(parseInt(h, 10));
          d.setMinutes(parseInt(m, 10));
          setReminderTime(d);
        } else {
          setReminderEnabled(false);
          setReminderTime(new Date());
        }
      } else {
        setName('');
        setGoal('');
        setSelectedIcon(null);
        setSelectedColor(COLOR_OPTIONS[0]);
        setReminderEnabled(false);
        setReminderTime(new Date());
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
      const formattedTime = reminderEnabled
        ? `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`
        : undefined;

      await onAdd({
        name: trimmed,
        icon: selectedIcon ?? DEFAULT_ICON,
        color: selectedColor,
        goal: goal.trim() || undefined,
        reminder_time: formattedTime,
      });
      setName(''); setGoal(''); setSelectedIcon(null); setSelectedColor(COLOR_OPTIONS[0]); setReminderEnabled(false);
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
<<<<<<< HEAD
        <Animated.View
=======
        <Animated.View 
>>>>>>> fe28807f352b02c3b8496b8fe3c9663a8d64dffa
          style={[
            styles.sheet,
            {
              transform: [{ translateY: panY }]
            }
          ]}
        >
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>
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

            <View style={styles.reminderSection}>
              <View style={styles.reminderHeader}>
                <View style={styles.reminderTitleRow}>
                  <Text style={styles.reminderIcon}>🔔</Text>
                  <Text style={styles.reminderTitle}>{t('addHabit.reminderTitle')}</Text>
                </View>
                <Switch
                  value={reminderEnabled}
                  onValueChange={setReminderEnabled}
                  trackColor={{ false: colors.cardBorder, true: colors.primaryGlow }}
                  thumbColor={reminderEnabled ? colors.primary : colors.textMuted}
                />
              </View>
              {reminderEnabled && (
                <View style={styles.timePickerContainer}>
                  {Platform.OS === 'android' ? (
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text style={styles.timeLabel}>{t('addHabit.reminderTime')}</Text>
                      <Text style={styles.timeButtonText}>
                        {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.iosTimeLabelRow}>
                      <Text style={styles.timeLabel}>{t('addHabit.reminderTime')}</Text>
                    </View>
                  )}
                  {(showTimePicker || Platform.OS === 'ios') && (
                    <DateTimePicker
                      value={reminderTime}
                      mode="time"
                      is24Hour={true}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      themeVariant="dark"
                      textColor={colors.text}
                      onChange={(event, date) => {
                        setShowTimePicker(Platform.OS === 'ios');
                        if (date) setReminderTime(date);
                      }}
                      style={Platform.OS === 'ios' ? { height: 120 } : undefined}
                    />
                  )}
                </View>
              )}
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
        </Animated.View>
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
  },
  handleContainer: {
    paddingVertical: spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textMuted,
    borderRadius: 2,
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
  reminderSection: {
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reminderIcon: {
    fontSize: 18,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timePickerContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  timeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  timeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  timeButtonText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  iosTimeLabelRow: {
    marginBottom: spacing.sm,
  },
});
