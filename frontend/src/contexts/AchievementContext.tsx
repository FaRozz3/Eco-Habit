import React, { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import {
  useHabits,
  calcEcoPoints,
  calcLevel,
  type Habit,
} from './HabitContext';
import AchievementToast from '../components/AchievementToast';

export interface Badge {
  icon: string;
  label: string;
  earned: boolean;
}

export function evaluateBadges(habits: Habit[]): Badge[] {
  const ecoPoints = calcEcoPoints(habits);
  const level = calcLevel(ecoPoints);
  const maxStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const totalDays = habits.reduce((s, h) => s + h.streak, 0);
  const habitsWith7 = habits.filter((h) => h.streak >= 7).length;
  const habitsWith30 = habits.filter((h) => h.streak >= 30).length;
  const iconCount = new Set(habits.map((h) => h.icon)).size;
  const colorCount = new Set(habits.map((h) => h.color)).size;
  const completedToday = habits.filter((h) => h.completed_today).length;

  return [
    { icon: '🌱', label: 'First Sprout', earned: habits.length >= 1 },
    { icon: '🌿', label: 'Growing Garden', earned: habits.length >= 3 },
    { icon: '🌳', label: 'Own Forest', earned: habits.length >= 5 },
    { icon: '🎋', label: 'Full Ecosystem', earned: habits.length >= 10 },
    { icon: '🔥', label: 'First Spark', earned: maxStreak >= 3 },
    { icon: '💎', label: 'Diamond Week', earned: maxStreak >= 7 },
    { icon: '🌙', label: 'Two Weeks', earned: maxStreak >= 14 },
    { icon: '👑', label: 'Habit Master', earned: maxStreak >= 30 },
    { icon: '🦁', label: 'Steady King', earned: maxStreak >= 60 },
    { icon: '🏆', label: 'Living Legend', earned: maxStreak >= 100 },
    { icon: '⭐', label: 'Perfect Day', earned: habits.length > 0 && completedToday === habits.length },
    { icon: '💪', label: 'Consistent', earned: habitsWith7 >= 2 },
    { icon: '🧘', label: 'Balance', earned: habitsWith7 >= 3 },
    { icon: '🚀', label: 'Liftoff', earned: totalDays >= 30 },
    { icon: '🌟', label: 'Supernova', earned: totalDays >= 100 },
    { icon: '🌈', label: 'All Colors', earned: habitsWith30 >= 2 },
    { icon: '🌍', label: 'Eco-Conscious', earned: iconCount >= 4 },
    { icon: '🎨', label: 'Full Palette', earned: colorCount >= 6 },
    { icon: '🔬', label: 'Scientist', earned: habits.length >= 5 },
    { icon: '🦋', label: 'Metamorphosis', earned: totalDays >= 50 },
    { icon: '🌱', label: 'Eco Seedling', earned: level >= 5 },
    { icon: '🌿', label: 'Eco Sprout', earned: level >= 10 },
    { icon: '🛡️', label: 'Eco Guardian', earned: level >= 20 },
    { icon: '⚔️', label: 'Eco Ranger', earned: level >= 35 },
    { icon: '👑', label: 'Eco Legend', earned: level >= 50 },
    { icon: '🌌', label: 'Eco Master', earned: level >= 75 },
  ];
}

const AchievementContext = createContext<null>(null);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const { habits } = useHabits();
  const prevEarnedRef = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const [queue, setQueue] = useState<{ icon: string; label: string }[]>([]);
  const [current, setCurrent] = useState<{ icon: string; label: string } | null>(null);

  useEffect(() => {
    const badges = evaluateBadges(habits);
    const earnedNow = new Set(badges.filter((b) => b.earned).map((b) => b.label));

    if (!initialized.current) {
      prevEarnedRef.current = earnedNow;
      initialized.current = true;
      return;
    }

    const newlyEarned: { icon: string; label: string }[] = [];
    for (const b of badges) {
      if (b.earned && !prevEarnedRef.current.has(b.label)) {
        newlyEarned.push({ icon: b.icon, label: b.label });
      }
    }

    prevEarnedRef.current = earnedNow;

    if (newlyEarned.length > 0) {
      setQueue((prev) => [...prev, ...newlyEarned]);
    }
  }, [habits]);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [queue, current]);

  const handleHide = useCallback(() => {
    setCurrent(null);
  }, []);

  return (
    <AchievementContext.Provider value={null}>
      {children}
      <AchievementToast
        icon={current?.icon ?? ''}
        label={current?.label ?? ''}
        visible={current !== null}
        onHide={handleHide}
      />
    </AchievementContext.Provider>
  );
}
