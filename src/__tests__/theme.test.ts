// Mock AsyncStorage (required because HabitContext imports it)
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock localDb (required because HabitContext imports it)
jest.mock('../services/localDb', () => ({
  initLocalDb: jest.fn(),
  getFullHabits: jest.fn(),
  createHabit: jest.fn(),
  updateHabit: jest.fn(),
  deleteHabit: jest.fn(),
  checkHabitToday: jest.fn(),
  uncheckHabitToday: jest.fn(),
}));

import {
  calcLevel,
  levelTitle,
  calcEcoPoints,
  pointsToNextLevel,
} from '../contexts/HabitContext';
import type { Habit } from '../contexts/HabitContext';

/**
 * Validates: Requirements 3.1, 3.2, 3.3, 3.5
 */

// Helper to create a minimal Habit object for testing
function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 1,
    name: 'Test',
    icon: '🌱',
    color: '#2ECC71',
    created_at: '2024-01-01',
    streak: 0,
    completed_today: false,
    last_7_days: [false, false, false, false, false, false, false],
    ...overrides,
  };
}

// ─── calcLevel (Requirement 3.2) ─────────────────────────────────────────────
// Level = floor(Eco_Points / 100) + 1

describe('calcLevel', () => {
  it('returns level 1 for 0 eco points', () => {
    expect(calcLevel(0)).toBe(1);
  });

  it('returns level 1 for 99 eco points (just below threshold)', () => {
    expect(calcLevel(99)).toBe(1);
  });

  it('returns level 2 for exactly 100 eco points', () => {
    expect(calcLevel(100)).toBe(2);
  });

  it('returns level 5 for 400 eco points (Eco Sprout boundary)', () => {
    expect(calcLevel(400)).toBe(5);
  });

  it('returns level 10 for 900 eco points (Eco Guardian boundary)', () => {
    expect(calcLevel(900)).toBe(10);
  });

  it('returns level 20 for 1900 eco points (Eco Ranger boundary)', () => {
    expect(calcLevel(1900)).toBe(20);
  });

  it('returns level 35 for 3400 eco points (Eco Legend boundary)', () => {
    expect(calcLevel(3400)).toBe(35);
  });

  it('returns level 50 for 4900 eco points (Eco Master boundary)', () => {
    expect(calcLevel(4900)).toBe(50);
  });

  it('returns level 51 for 5000 eco points', () => {
    expect(calcLevel(5000)).toBe(51);
  });

  it('handles mid-range values correctly', () => {
    expect(calcLevel(1350)).toBe(14);
  });
});

// ─── levelTitle (Requirement 3.3) ────────────────────────────────────────────

describe('levelTitle', () => {
  it('returns "Eco Seedling" for level 1', () => {
    expect(levelTitle(1)).toBe('Eco Seedling');
  });

  it('returns "Eco Seedling" for level 4 (upper boundary)', () => {
    expect(levelTitle(4)).toBe('Eco Seedling');
  });

  it('returns "Eco Sprout" for level 5 (lower boundary)', () => {
    expect(levelTitle(5)).toBe('Eco Sprout');
  });

  it('returns "Eco Sprout" for level 9 (upper boundary)', () => {
    expect(levelTitle(9)).toBe('Eco Sprout');
  });

  it('returns "Eco Guardian" for level 10 (lower boundary)', () => {
    expect(levelTitle(10)).toBe('Eco Guardian');
  });

  it('returns "Eco Guardian" for level 19 (upper boundary)', () => {
    expect(levelTitle(19)).toBe('Eco Guardian');
  });

  it('returns "Eco Ranger" for level 20 (lower boundary)', () => {
    expect(levelTitle(20)).toBe('Eco Ranger');
  });

  it('returns "Eco Ranger" for level 34 (upper boundary)', () => {
    expect(levelTitle(34)).toBe('Eco Ranger');
  });

  it('returns "Eco Legend" for level 35 (lower boundary)', () => {
    expect(levelTitle(35)).toBe('Eco Legend');
  });

  it('returns "Eco Legend" for level 49 (upper boundary)', () => {
    expect(levelTitle(49)).toBe('Eco Legend');
  });

  it('returns "Eco Master" for level 50 (lower boundary)', () => {
    expect(levelTitle(50)).toBe('Eco Master');
  });

  it('returns "Eco Master" for level 100 (well above threshold)', () => {
    expect(levelTitle(100)).toBe('Eco Master');
  });
});

// ─── calcEcoPoints (Requirement 3.1) ─────────────────────────────────────────
// Eco_Points = (sum of all habit streaks × 50) + (completed today × 20)

describe('calcEcoPoints', () => {
  it('returns 0 when no habits', () => {
    expect(calcEcoPoints([])).toBe(0);
  });

  it('calculates points from streaks only (no completions today)', () => {
    const habits = [
      makeHabit({ id: 1, streak: 3, completed_today: false }),
      makeHabit({ id: 2, streak: 5, completed_today: false }),
    ];
    // sum streaks = 8, 8 × 50 = 400
    expect(calcEcoPoints(habits)).toBe(400);
  });

  it('calculates points from completions only (no streaks)', () => {
    const habits = [
      makeHabit({ id: 1, streak: 0, completed_today: true }),
      makeHabit({ id: 2, streak: 0, completed_today: true }),
      makeHabit({ id: 3, streak: 0, completed_today: true }),
      makeHabit({ id: 4, streak: 0, completed_today: true }),
    ];
    // 4 completed today → 4 × 20 = 80
    expect(calcEcoPoints(habits)).toBe(80);
  });

  it('calculates combined streak and completion points', () => {
    const habits = [
      makeHabit({ id: 1, streak: 2, completed_today: true }),
      makeHabit({ id: 2, streak: 3, completed_today: true }),
      makeHabit({ id: 3, streak: 1, completed_today: false }),
    ];
    // sum streaks = 6, 6 × 50 = 300; 2 completed → 2 × 20 = 40; total = 340
    expect(calcEcoPoints(habits)).toBe(340);
  });

  it('handles a single habit with streak of 1 completed today', () => {
    const habits = [makeHabit({ streak: 1, completed_today: true })];
    // 1 × 50 = 50 + 1 × 20 = 20 → 70
    expect(calcEcoPoints(habits)).toBe(70);
  });

  it('handles large streak values', () => {
    const habits = [makeHabit({ streak: 100, completed_today: true })];
    // 100 × 50 = 5000 + 1 × 20 = 20 → 5020
    expect(calcEcoPoints(habits)).toBe(5020);
  });

  it('handles zero streaks', () => {
    const habits = [
      makeHabit({ id: 1, streak: 0, completed_today: false }),
      makeHabit({ id: 2, streak: 0, completed_today: false }),
      makeHabit({ id: 3, streak: 5, completed_today: true }),
    ];
    // sum streaks = 5, 5 × 50 = 250; 1 completed → 20; total = 270
    expect(calcEcoPoints(habits)).toBe(270);
  });
});

// ─── pointsToNextLevel (Requirement 3.5) ─────────────────────────────────────

describe('pointsToNextLevel', () => {
  it('returns 100 when at 0 eco points (level 1, need 100 to reach level 2)', () => {
    expect(pointsToNextLevel(0)).toBe(100);
  });

  it('returns 1 when at 99 eco points (1 point away from level 2)', () => {
    expect(pointsToNextLevel(99)).toBe(1);
  });

  it('returns 100 when exactly at a level boundary (100 points = level 2)', () => {
    expect(pointsToNextLevel(100)).toBe(100);
  });

  it('returns 50 when halfway through a level', () => {
    expect(pointsToNextLevel(150)).toBe(50);
  });

  it('returns correct value for higher levels', () => {
    expect(pointsToNextLevel(1350)).toBe(50);
  });

  it('returns 100 at the Eco Master boundary (4900 points = level 50)', () => {
    expect(pointsToNextLevel(4900)).toBe(100);
  });
});
