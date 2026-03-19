import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  claimed: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementContextType {
  badges: Badge[];
  claimBadge: (label: string) => void;
}

export function evaluateBadges(habits: Habit[], claimedLabels: Set<string> = new Set()): Badge[] {
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
    // Old Badges adapted to MaterialCommunityIcons
    { icon: 'leaf', label: 'badges.firstSprout', earned: habits.length >= 1, claimed: claimedLabels.has('badges.firstSprout'), rarity: 'common' },
    { icon: 'tree-outline', label: 'badges.growingGarden', earned: habits.length >= 3, claimed: claimedLabels.has('badges.growingGarden'), rarity: 'common' },
    { icon: 'pine-tree', label: 'badges.ownForest', earned: habits.length >= 5, claimed: claimedLabels.has('badges.ownForest'), rarity: 'rare' },
    { icon: 'forest', label: 'badges.fullEcosystem', earned: habits.length >= 10, claimed: claimedLabels.has('badges.fullEcosystem'), rarity: 'epic' },
    
    { icon: 'fire', label: 'badges.firstSpark', earned: maxStreak >= 3, claimed: claimedLabels.has('badges.firstSpark'), rarity: 'common' },
    { icon: 'diamond-stone', label: 'badges.diamondWeek', earned: maxStreak >= 7, claimed: claimedLabels.has('badges.diamondWeek'), rarity: 'rare' },
    { icon: 'weather-night', label: 'badges.twoWeeks', earned: maxStreak >= 14, claimed: claimedLabels.has('badges.twoWeeks'), rarity: 'epic' },
    { icon: 'crown', label: 'badges.habitMaster', earned: maxStreak >= 30, claimed: claimedLabels.has('badges.habitMaster'), rarity: 'legendary' },
    { icon: 'shield-crown', label: 'badges.steadyKing', earned: maxStreak >= 60, claimed: claimedLabels.has('badges.steadyKing'), rarity: 'legendary' },
    { icon: 'trophy', label: 'badges.livingLegend', earned: maxStreak >= 100, claimed: claimedLabels.has('badges.livingLegend'), rarity: 'legendary' },
    
    { icon: 'star', label: 'badges.perfectDay', earned: habits.length > 0 && completedToday === habits.length, claimed: claimedLabels.has('badges.perfectDay'), rarity: 'rare' },
    { icon: 'arm-flex', label: 'badges.consistent', earned: habitsWith7 >= 2, claimed: claimedLabels.has('badges.consistent'), rarity: 'epic' },
    { icon: 'scale-balance', label: 'badges.balance', earned: habitsWith7 >= 3, claimed: claimedLabels.has('badges.balance'), rarity: 'legendary' },
    
    { icon: 'rocket-launch', label: 'badges.liftoff', earned: totalDays >= 30, claimed: claimedLabels.has('badges.liftoff'), rarity: 'rare' },
    { icon: 'star-shooting', label: 'badges.supernova', earned: totalDays >= 100, claimed: claimedLabels.has('badges.supernova'), rarity: 'epic' },
    { icon: 'palette-swatch', label: 'badges.allColors', earned: habitsWith30 >= 2, claimed: claimedLabels.has('badges.allColors'), rarity: 'legendary' },
    { icon: 'earth', label: 'badges.ecoConscious', earned: iconCount >= 4, claimed: claimedLabels.has('badges.ecoConscious'), rarity: 'epic' },
    { icon: 'palette', label: 'badges.fullPalette', earned: colorCount >= 6, claimed: claimedLabels.has('badges.fullPalette'), rarity: 'rare' },
    { icon: 'flask', label: 'badges.scientist', earned: habits.length >= 5, claimed: claimedLabels.has('badges.scientist'), rarity: 'epic' },
    { icon: 'butterfly', label: 'badges.metamorphosis', earned: totalDays >= 50, claimed: claimedLabels.has('badges.metamorphosis'), rarity: 'legendary' },

    // Level Badges
    { icon: 'sprout', label: 'badges.ecoSeedlingBadge', earned: level >= 5, claimed: claimedLabels.has('badges.ecoSeedlingBadge'), rarity: 'common' },
    { icon: 'leaf-circle', label: 'badges.ecoSproutBadge', earned: level >= 10, claimed: claimedLabels.has('badges.ecoSproutBadge'), rarity: 'rare' },
    { icon: 'shield-leaf', label: 'badges.ecoGuardianBadge', earned: level >= 20, claimed: claimedLabels.has('badges.ecoGuardianBadge'), rarity: 'epic' },
    { icon: 'sword-cross', label: 'badges.ecoRangerBadge', earned: level >= 35, claimed: claimedLabels.has('badges.ecoRangerBadge'), rarity: 'legendary' },
    { icon: 'crown-outline', label: 'badges.ecoLegendBadge', earned: level >= 50, claimed: claimedLabels.has('badges.ecoLegendBadge'), rarity: 'legendary' },
    { icon: 'galaxy', label: 'badges.ecoMasterBadge', earned: level >= 75, claimed: claimedLabels.has('badges.ecoMasterBadge'), rarity: 'legendary' },

    // New Mockup Specific Badges
    { icon: 'leaf', label: 'badges.seedling', earned: habits.length >= 1, claimed: claimedLabels.has('badges.seedling'), rarity: 'common' },
    { icon: 'water', label: 'badges.hydroHero', earned: habits.some(h => h.icon.includes('water') && h.streak >= 3) || habits.length >= 5, claimed: claimedLabels.has('badges.hydroHero'), rarity: 'rare' },
    { icon: 'solar-power', label: 'badges.solarSoul', earned: level >= 8, claimed: claimedLabels.has('badges.solarSoul'), rarity: 'epic' },
    { icon: 'lightning-bolt', label: 'badges.sevenDayStreak', earned: maxStreak >= 7, claimed: claimedLabels.has('badges.sevenDayStreak'), rarity: 'common' },
    { icon: 'calendar-month', label: 'badges.thirtyDays', earned: maxStreak >= 30, claimed: claimedLabels.has('badges.thirtyDays'), rarity: 'epic' },
    { icon: 'medal', label: 'badges.unstoppable', earned: maxStreak >= 50, claimed: claimedLabels.has('badges.unstoppable'), rarity: 'legendary' },
    { icon: 'meditation', label: 'badges.zenMaster', earned: habits.some(h => h.streak >= 14), claimed: claimedLabels.has('badges.zenMaster'), rarity: 'rare' },
    { icon: 'lotus', label: 'badges.innerCalm', earned: habits.some(h => h.streak >= 21), claimed: claimedLabels.has('badges.innerCalm'), rarity: 'epic' },
    { icon: 'weather-night', label: 'badges.dreamer', earned: habits.length >= 5 && maxStreak >= 5, claimed: claimedLabels.has('badges.dreamer'), rarity: 'epic' },
    
    { icon: 'pine-tree-box', label: 'badges.natureGuardian', earned: ecoPoints > 2000, claimed: claimedLabels.has('badges.natureGuardian'), rarity: 'legendary' }
  ];
}

const NOTIFIED_BADGES_KEY = 'ecohabit_notified_badges';
const CLAIMED_BADGES_KEY = 'ecohabit_claimed_badges';

export const AchievementContext = createContext<AchievementContextType>({
  badges: [],
  claimBadge: () => {}
});

export const useAchievements = () => useContext(AchievementContext);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const { habits } = useHabits();
  const prevEarnedRef = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const [queue, setQueue] = useState<{ icon: string; label: string }[]>([]);
  const [current, setCurrent] = useState<{ icon: string; label: string } | null>(null);

  const [claimedLabels, setClaimedLabels] = useState<Set<string>>(new Set());

  // Load previously notified and claimed badges on mount
  useEffect(() => {
    AsyncStorage.getItem(NOTIFIED_BADGES_KEY).then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as string[];
          prevEarnedRef.current = new Set(parsed);
        } catch (e) {
          console.error('Failed to parse notified badges:', e);
        }
      }
      initialized.current = true;
    });

    AsyncStorage.getItem(CLAIMED_BADGES_KEY).then((stored) => {
      if (stored) {
        try {
           const parsed = JSON.parse(stored) as string[];
           setClaimedLabels(new Set(parsed));
        } catch (e) {
           console.error('Failed to parse claimed badges:', e);
        }
      }
    });
  }, []);

  const currentBadges = useMemo(() => evaluateBadges(habits, claimedLabels), [habits, claimedLabels]);

  useEffect(() => {
    if (!initialized.current) return;

    const earnedNow = new Set(currentBadges.filter((b: Badge) => b.earned).map((b: Badge) => b.label));
    const newlyEarned: { icon: string; label: string }[] = [];

    for (const b of currentBadges) {
      if (b.earned && !prevEarnedRef.current.has(b.label)) {
        newlyEarned.push({ icon: b.icon, label: b.label });
      }
    }

    if (newlyEarned.length > 0) {
      // Update memory reference
      prevEarnedRef.current = new Set([...Array.from(prevEarnedRef.current), ...Array.from(earnedNow)]);

      // Persist to storage
      AsyncStorage.setItem(NOTIFIED_BADGES_KEY, JSON.stringify(Array.from(prevEarnedRef.current)))
        .catch((e) => console.error('Failed to save notified badges:', e));

      // Queue notifications
      setQueue((prev) => [...prev, ...newlyEarned]);
    }
  }, [currentBadges]);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [queue, current]);

  const handleHide = useCallback(() => {
    setCurrent(null);
  }, []);

  const claimBadge = useCallback((label: string) => {
    setClaimedLabels(prev => {
      const updated = new Set([...prev, label]);
      AsyncStorage.setItem(CLAIMED_BADGES_KEY, JSON.stringify(Array.from(updated)))
        .catch(e => console.error('Failed to save claimed badges:', e));
      return updated;
    });
  }, []);

  return (
    <AchievementContext.Provider value={{ badges: currentBadges, claimBadge }}>
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
