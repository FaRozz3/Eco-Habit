import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, RefreshControl, StyleSheet,
  SafeAreaView, StatusBar, Alert, Platform, Animated,
} from 'react-native';
import { useHabits, calcEcoPoints, calcLevel, levelTitle, pointsToNextLevel } from '../contexts/HabitContext';
import type { Habit } from '../contexts/HabitContext';
import { useWelcome } from '../contexts/WelcomeContext';
import HabitCard from '../components/HabitCard';
import GrowthOrb from '../components/GrowthOrb';
import StatsCards from '../components/StatsCards';
import DailyProgress from '../components/DailyProgress';
import AddHabitModal from '../components/AddHabitModal';
import { colors, spacing, glassCard } from '../theme';
import { useI18n } from '../contexts/I18nContext';

export default function TodayScreen() {
  const { habits, isLoading, fetchHabits, checkHabit, uncheckHabit, addHabit, updateHabit, deleteHabit } = useHabits();
  const { userName } = useWelcome();
  const { t } = useI18n();
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);
  const onRefresh = useCallback(() => { fetchHabits(); }, [fetchHabits]);

  const ecoPoints = calcEcoPoints(habits);
  const level = calcLevel(ecoPoints);
  const title = levelTitle(level);
  const nextLevel = pointsToNextLevel(ecoPoints);
  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
  const completedCount = habits.filter(h => h.completed_today).length;

  // Level-up notification
  const prevLevelRef = useRef(level);
  const [levelUpToast, setLevelUpToast] = useState<{ level: number; title: string } | null>(null);
  const toastTranslateY = useRef(new Animated.Value(-120)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prevLevelRef.current < level && prevLevelRef.current > 0) {
      setLevelUpToast({ level, title });
      Animated.parallel([
        Animated.spring(toastTranslateY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(toastTranslateY, { toValue: -120, duration: 300, useNativeDriver: true }),
          Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setLevelUpToast(null));
      }, 3000);

      prevLevelRef.current = level;
      return () => clearTimeout(timer);
    }
    prevLevelRef.current = level;
  }, [level, title]);

  const handleLongPress = useCallback((habit: Habit) => {
    if (Platform.OS === 'web') {
      const action = window.prompt(`${habit.name}\n\n${t('habit.editPrompt')}`);
      if (action?.toLowerCase() === 'edit') {
        setEditingHabit(habit);
        setEditModalVisible(true);
      } else if (action?.toLowerCase() === 'delete') {
        if (window.confirm(t('habit.confirmDelete', { name: habit.name }))) {
          deleteHabit(habit.id);
        }
      }
    } else {
      Alert.alert(habit.name, t('habit.whatToDo'), [
        { text: t('habit.edit'), onPress: () => { setEditingHabit(habit); setEditModalVisible(true); } },
        { text: t('habit.delete'), style: 'destructive', onPress: () => deleteHabit(habit.id) },
        { text: t('habit.cancel'), style: 'cancel' },
      ]);
    }
  }, [deleteHabit, t]);

  const handleEditSubmit = useCallback(async (data: { name: string; icon: string; color: string; goal?: string }) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, data);
      setEditModalVisible(false);
      setEditingHabit(null);
    }
  }, [editingHabit, updateHabit]);

  const ListHeader = () => (
    <View>
      {/* ── Hero Header ── */}
      <View style={styles.header}>
        {/* Background ambient glow */}
        <View style={styles.headerGlow} />
        <GrowthOrb level={level} title={title} />
      </View>

      {/* ── Stats Row ── */}
      <StatsCards
        totalStreak={totalStreak}
        ecoPoints={ecoPoints}
        nextLevelPoints={nextLevel}
        weekChange={5}
      />

      {/* ── Daily Progress ── */}
      <DailyProgress completed={completedCount} total={habits.length} />

      {/* ── Section Title ── */}
      <Text style={styles.sectionTitle}>{t('today.currentHabits')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {levelUpToast && (
        <Animated.View style={[styles.levelToast, { transform: [{ translateY: toastTranslateY }], opacity: toastOpacity }]}>
          <View style={styles.levelToastGlow} />
          <View style={styles.levelToastCard}>
            <Text style={styles.levelToastIcon}>⬆️</Text>
            <View style={styles.levelToastText}>
              <Text style={styles.levelToastTitle}>{t('today.levelUp')}</Text>
              <Text style={styles.levelToastLabel}>Level {levelUpToast.level} • {levelUpToast.title}</Text>
            </View>
          </View>
        </Animated.View>
      )}
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.habitWrapper}>
            <HabitCard
              name={item.name}
              streak={item.streak}
              completedToday={item.completed_today}
              onCheck={() => item.completed_today ? uncheckHabit(item.id) : checkHabit(item.id)}
              onLongPress={() => handleLongPress(item)}
              icon={item.icon}
              color={item.color}
              goal={item.goal}
              last7Days={item.last_7_days}
            />
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🌱</Text>
              <Text style={styles.emptyText}>{t('today.noHabits')}</Text>
              <Text style={styles.emptySubtext}>{t('today.noHabitsHint')}</Text>
            </View>
          ) : null
        }
      />
      <AddHabitModal visible={modalVisible} onClose={() => setModalVisible(false)} onAdd={addHabit} />
      <AddHabitModal
        visible={editModalVisible}
        onClose={() => { setEditModalVisible(false); setEditingHabit(null); }}
        onAdd={handleEditSubmit}
        editMode
        initialData={editingHabit ? { name: editingHabit.name, icon: editingHabit.icon, color: editingHabit.color, goal: editingHabit.goal } : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: 120 },

  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -40,
    left: '50%',
    marginLeft: -128,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'transparent',
    shadowColor: '#00f59f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
    elevation: 0,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },

  habitWrapper: {
    paddingHorizontal: spacing.lg,
  },

  empty: { alignItems: 'center', marginTop: 40, paddingHorizontal: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, color: colors.textSecondary, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: colors.textMuted, marginTop: 4, textAlign: 'center' },

  // Level-up toast
  levelToast: {
    position: 'absolute',
    top: 50,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    alignItems: 'center',
  },
  levelToastGlow: {
    position: 'absolute',
    top: -10,
    left: '20%',
    right: '20%',
    height: 40,
    backgroundColor: colors.primary,
    opacity: 0.15,
    borderRadius: 20,
  },
  levelToastCard: {
    ...glassCard,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(0, 245, 159, 0.08)',
    borderColor: 'rgba(0, 245, 159, 0.3)',
    width: '100%',
  },
  levelToastIcon: { fontSize: 36, marginRight: spacing.md },
  levelToastText: { flex: 1 },
  levelToastTitle: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  levelToastLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
});
