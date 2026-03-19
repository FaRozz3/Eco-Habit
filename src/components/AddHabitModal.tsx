import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Switch, Animated, PanResponder, Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, glassCard, spacing, radius, fontFamilies, getIconBg } from '../theme';
import { useI18n } from '../contexts/I18nContext';

const CATEGORIES = [
  { id: 'hydration', name: 'Hydration', icon: 'water-drop', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  { id: 'reading', name: 'Reading', icon: 'menu-book', color: '#BB86FC', bg: 'rgba(187,134,252,0.1)' },
  { id: 'nature', name: 'Nature', icon: 'park', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  { id: 'zen', name: 'Zen', icon: 'self-improvement', color: '#BB86FC', bg: 'rgba(187,134,252,0.1)' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Gesture & Animation State
  const panY = React.useRef(new Animated.Value(0)).current;
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');

  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only capture if moving vertically and distance is significant (~20px)
      // This allows tap events for TextInput to pass through.
      return Math.abs(gestureState.dy) > 20;
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
        // Mapping legacy icon/color if needed, but for now just defaulting to first category
        setSelectedCategory(CATEGORIES.find(c => c.name === initialData.icon)?.id || CATEGORIES[0].id);
        
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
        setSelectedCategory(CATEGORIES[0].id);
        setFrequency('daily');
        setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
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

      const category = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];

      await onAdd({
        name: trimmed,
        icon: category.name,
        color: category.color,
        goal: goal.trim() || undefined,
        reminder_time: formattedTime,
      });
      onClose();
    } catch {
      Alert.alert(t('errors.error'), editMode ? t('addHabit.errorUpdate') : t('addHabit.errorCreate'));
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (index: number) => {
    if (selectedDays.includes(index)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== index));
      }
    } else {
      setSelectedDays([...selectedDays, index].sort());
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: panY }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleAnimateClose} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={colors.primaryNeon} />
              </TouchableOpacity>
              <Text style={styles.title}>{editMode ? 'Edit Habit' : 'Create Habit'}</Text>
            </View>

            {/* Habit Identification */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>HABIT IDENTIFICATION</Text>
              <View style={[styles.glassInputContainer, { borderColor: error ? colors.error : 'rgba(187, 134, 252, 0.2)' }]}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Deep Breathing"
                  placeholderTextColor={colors.description}
                  value={name}
                  onChangeText={(txt) => { setName(txt); setError(''); }}
                  editable={!loading}
                  autoFocus
                />
                <MaterialIcons name="flare" size={20} color={colors.primaryNeon} />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={[styles.glassInputContainer, { marginTop: 12 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Monthly Goal (optional)"
                  placeholderTextColor={colors.description}
                  value={goal}
                  onChangeText={setGoal}
                  editable={!loading}
                />
                <MaterialIcons name="track-changes" size={20} color={colors.primaryNeon} />
              </View>
            </View>

            {/* Select Category */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SELECT CATEGORY</Text>
              <View style={styles.bentoGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.bentoItem,
                      selectedCategory === cat.id && { borderColor: cat.color, backgroundColor: cat.bg }
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: `${cat.color}20` }]}>
                      <MaterialIcons name={cat.icon as any} size={28} color={cat.color} />
                    </View>
                    <Text style={[styles.bentoText, selectedCategory === cat.id && { color: '#fff' }]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Frequency */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>FREQUENCY</Text>
              <View style={styles.frequencyRow}>
                {(['daily', 'weekly', 'custom'] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.freqButton, frequency === f && styles.freqButtonActive]}
                    onPress={() => {
                      setFrequency(f);
                      if (f === 'daily') setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
                      if (f === 'weekly') setSelectedDays([new Date().getDay()]);
                    }}
                  >
                    <Text style={[styles.freqText, frequency === f && styles.freqTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {frequency === 'custom' && (
                <View style={styles.daysRow}>
                  {DAYS.map((day, index) => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dayCircle, selectedDays.includes(index) && styles.dayCircleActive]}
                      onPress={() => toggleDay(index)}
                    >
                      <Text style={[styles.dayText, selectedDays.includes(index) && styles.dayTextActive]}>
                        {day[0]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Reminder */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>REMINDER</Text>
              <TouchableOpacity 
                style={styles.reminderCard}
                onPress={() => setShowTimePicker(true)}
              >
                <View style={styles.reminderLeft}>
                  <View style={styles.reminderIconCircle}>
                    <MaterialIcons name="notifications-active" size={20} color={colors.primaryNeon} />
                  </View>
                  <View>
                    <Text style={styles.reminderMainText}>Morning Pulse</Text>
                    <Text style={styles.reminderSubText}>
                      {frequency === 'daily' ? 'Scheduled for every day' : 
                       frequency === 'weekly' ? 'Scheduled once a week' :
                       `Scheduled for ${selectedDays.length} days`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reminderTimeText}>
                  {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
                </Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={reminderTime}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowTimePicker(Platform.OS === 'ios');
                    if (date) setReminderTime(date);
                  }}
                />
              )}
            </View>

            {/* Goals Info (Aesthetic Only from mockup) */}
            <View style={styles.goalGrid}>
              <View style={styles.goalCard}>
                <MaterialIcons name="bolt" size={16} color={colors.neonPurple} />
                <Text style={styles.goalLabel}>Current Streak</Text>
                <Text style={styles.goalValue}>0 Days</Text>
              </View>
              <View style={styles.goalCard}>
                <MaterialIcons name="track-changes" size={16} color={colors.primaryNeon} />
                <Text style={styles.goalLabel}>Monthly Goal</Text>
                <Text style={styles.goalValue}>22 Times</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.createButton} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#0F1115" /> : <Text style={styles.createButtonText}>CREATE HABIT</Text>}
            </TouchableOpacity>
          </View>

          {/* Decorative background elements */}
          <View style={styles.decorTop} />
          <View style={styles.decorBottom} />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F1115',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '95%',
    paddingBottom: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: '#0F1115',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(22, 32, 29, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 160, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginLeft: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(0, 245, 160, 0.7)',
    letterSpacing: 2,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  glassInputContainer: {
    backgroundColor: 'rgba(22, 32, 29, 0.4)',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 56,
    color: '#fff',
    fontSize: 18,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bentoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(22, 32, 29, 0.4)',
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.2)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  bentoText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  frequencyRow: {
    backgroundColor: 'rgba(22, 32, 29, 0.4)',
    borderRadius: 16,
    padding: 6,
    flexDirection: 'row',
    gap: 8,
  },
  freqButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqButtonActive: {
    backgroundColor: colors.primaryNeon,
    shadowColor: colors.primaryNeon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  freqText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  freqTextActive: {
    color: '#0F1115',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(22, 32, 29, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  dayCircleActive: {
    backgroundColor: colors.primaryNeon,
    borderColor: colors.primaryNeon,
  },
  dayText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextActive: {
    color: '#0F1115',
  },
  reminderCard: {
    backgroundColor: 'rgba(22, 32, 29, 0.4)',
    borderRadius: 20,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.1)',
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  reminderIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 245, 160, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderMainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reminderSubText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  reminderTimeText: {
    color: colors.primaryNeon,
    fontSize: 18,
    fontWeight: '800',
  },
  goalGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  goalCard: {
    flex: 1,
    backgroundColor: 'rgba(22, 32, 29, 0.4)',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.1)',
  },
  goalLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
  goalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    padding: spacing.xl,
    paddingBottom: 40,
  },
  createButton: {
    backgroundColor: colors.primaryNeon,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryNeon,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  createButtonText: {
    color: '#0F1115',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  decorTop: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 245, 160, 0.05)',
  },
  decorBottom: {
    position: 'absolute',
    bottom: 50,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(187, 134, 252, 0.05)',
  },
});
