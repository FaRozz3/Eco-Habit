import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initLocalDb,
  getFullHabits,
  createHabit as dbCreateHabit,
  updateHabit as dbUpdateHabit,
  deleteHabit as dbDeleteHabit,
  checkHabitToday,
  uncheckHabitToday,
  type FullHabit,
} from '../services/localDb';

const GOALS_STORAGE_KEY = 'ecohabit_goals';

export interface Habit {
  id: number;
  name: string;
  icon: string;
  color: string;
  created_at: string;
  streak: number;
  completed_today: boolean;
  last_7_days: boolean[];
  goal?: string;
}

interface HabitContextType {
  habits: Habit[];
  isLoading: boolean;
  fetchHabits: () => Promise<void>;
  checkHabit: (id: number) => Promise<void>;
  uncheckHabit: (id: number) => Promise<void>;
  addHabit: (data: { name: string; icon: string; color: string; goal?: string }) => Promise<void>;
  updateHabit: (id: number, data: { name: string; icon: string; color: string; goal?: string }) => Promise<void>;
  deleteHabit: (id: number) => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

async function loadGoals(): Promise<Record<number, string>> {
  try {
    const raw = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function saveGoals(goals: Record<number, string>): Promise<void> {
  await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
}

function mergeGoals(fullHabits: FullHabit[], goals: Record<number, string>): Habit[] {
  return fullHabits.map((h) => ({ ...h, goal: goals[h.id] }));
}

export function HabitProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [goals, setGoals] = useState<Record<number, string>>({});
  const [dbReady, setDbReady] = useState(false);

  // Initialize SQLite database on mount
  useEffect(() => {
    (async () => {
      try {
        await initLocalDb();
        setDbReady(true);
      } catch (e) {
        console.error('Failed to init local DB:', e);
        Alert.alert(
          'Error',
          'No se pudo inicializar la base de datos local. Por favor reinicia la app. Si el problema persiste, intenta reinstalarla.',
        );
      }
    })();
  }, []);

  const fetchHabits = useCallback(async () => {
    if (!dbReady) return;
    setIsLoading(true);
    try {
      const [fullHabits, g] = await Promise.all([getFullHabits(), loadGoals()]);
      setGoals(g);
      setHabits(mergeGoals(fullHabits, g));
    } catch (e) {
      console.error('fetchHabits error:', e);
      Alert.alert('Error', 'No se pudieron cargar los hábitos');
    } finally {
      setIsLoading(false);
    }
  }, [dbReady]);

  // Auto-fetch when DB is ready
  useEffect(() => {
    if (dbReady) fetchHabits();
  }, [dbReady, fetchHabits]);

  const checkHabit = useCallback(async (id: number) => {
    // Optimistic update
    setHabits((current) =>
      current.map((h) =>
        h.id === id
          ? {
              ...h,
              completed_today: true,
              streak: h.completed_today ? h.streak : h.streak + 1,
              last_7_days: h.completed_today
                ? h.last_7_days
                : [...h.last_7_days.slice(0, 6), true],
            }
          : h,
      ),
    );
    try {
      await checkHabitToday(id);
    } catch {
      // Revert on error
      await fetchHabits();
      Alert.alert('Error', 'No se pudo marcar el hábito');
    }
  }, [fetchHabits]);

  const uncheckHabit = useCallback(async (id: number) => {
    setHabits((current) =>
      current.map((h) =>
        h.id === id
          ? {
              ...h,
              completed_today: false,
              streak: Math.max(0, h.streak - 1),
              last_7_days: [...h.last_7_days.slice(0, 6), false],
            }
          : h,
      ),
    );
    try {
      await uncheckHabitToday(id);
    } catch {
      await fetchHabits();
      Alert.alert('Error', 'No se pudo desmarcar el hábito');
    }
  }, [fetchHabits]);

  const addHabit = useCallback(async (data: { name: string; icon: string; color: string; goal?: string }) => {
    const newRow = await dbCreateHabit(data.name, data.icon, data.color);
    const newHabit: Habit = {
      ...newRow,
      streak: 0,
      completed_today: false,
      last_7_days: [false, false, false, false, false, false, false],
      goal: data.goal,
    };
    if (data.goal) {
      const newGoals = { ...goals, [newRow.id]: data.goal };
      setGoals(newGoals);
      await saveGoals(newGoals);
    }
    setHabits((current) => [...current, newHabit]);
  }, [goals]);

  const updateHabit = useCallback(async (id: number, data: { name: string; icon: string; color: string; goal?: string }) => {
    const previous = [...habits];
    setHabits((current) => current.map((h) => h.id === id ? { ...h, ...data } : h));
    try {
      await dbUpdateHabit(id, data.name, data.icon, data.color);
      const newGoals = { ...goals };
      if (data.goal !== undefined) newGoals[id] = data.goal;
      else delete newGoals[id];
      setGoals(newGoals);
      await saveGoals(newGoals);
    } catch {
      setHabits(previous);
      Alert.alert('Error', 'No se pudo actualizar el hábito');
    }
  }, [habits, goals]);

  const deleteHabit = useCallback(async (id: number) => {
    const previous = [...habits];
    setHabits((current) => current.filter((h) => h.id !== id));
    try {
      await dbDeleteHabit(id);
      const newGoals = { ...goals };
      delete newGoals[id];
      setGoals(newGoals);
      await saveGoals(newGoals);
    } catch {
      setHabits(previous);
      Alert.alert('Error', 'No se pudo eliminar el hábito');
    }
  }, [habits, goals]);

  return (
    <HabitContext.Provider value={{ habits, isLoading, fetchHabits, checkHabit, uncheckHabit, addHabit, updateHabit, deleteHabit }}>
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits(): HabitContextType {
  const context = useContext(HabitContext);
  if (!context) throw new Error('useHabits must be used within a HabitProvider');
  return context;
}

// ─── Level / Eco-Points helpers (exported for use across screens) ─────────────
export function calcEcoPoints(habits: Habit[]): number {
  const base = habits.reduce((sum, h) => sum + h.streak * 50, 0);
  const bonusToday = habits.filter(h => h.completed_today).length * 20;
  return base + bonusToday;
}

export function calcLevel(ecoPoints: number): number {
  return Math.floor(ecoPoints / 100) + 1;
}

export function levelTitle(level: number): string {
  if (level < 5) return 'Eco Seedling';
  if (level < 10) return 'Eco Sprout';
  if (level < 20) return 'Eco Guardian';
  if (level < 35) return 'Eco Ranger';
  if (level < 50) return 'Eco Legend';
  return 'Eco Master';
}

export function pointsToNextLevel(ecoPoints: number): number {
  const level = calcLevel(ecoPoints);
  return level * 100 - ecoPoints;
}
