import fc from 'fast-check';

// Mock expo-sqlite dependency (pulled in via localDb.ts)
jest.mock('../../services/localDb', () => ({
  initLocalDb: jest.fn(),
  getFullHabits: jest.fn(),
  createHabit: jest.fn(),
  updateHabit: jest.fn(),
  deleteHabit: jest.fn(),
  checkHabitToday: jest.fn(),
  uncheckHabitToday: jest.fn(),
}));

import {
  calcEcoPoints,
  calcLevel,
  levelTitle,
  pointsToNextLevel,
  type Habit,
} from '../HabitContext';

// ─── Habit generator ────────────────────────────────────────────────────────
const habitArb: fc.Arbitrary<Habit> = fc.record({
  id: fc.integer({ min: 1, max: 10_000 }),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  icon: fc.constantFrom('🌿', '💪', '📖', '🧘', '💧'),
  color: fc.constantFrom('#2ECC71', '#3498DB', '#E74C3C', '#9B59B6'),
  created_at: fc.constant('2025-01-01T00:00:00Z'),
  streak: fc.integer({ min: 0, max: 1_000 }),
  completed_today: fc.boolean(),
  last_7_days: fc.array(fc.boolean(), { minLength: 7, maxLength: 7 }),
});

/**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.5**
 *
 * Property 1: Consistencia de cálculo de Eco Points
 * For any list of habits, calcEcoPoints(habits) equals
 * sum(h.streak * 50 for each h) + count(h where h.completed_today) * 20.
 * Result is always >= 0.
 */
describe('calcEcoPoints — Property 1: Consistencia de cálculo de Eco Points', () => {
  it('matches the formula sum(streak*50) + count(completed_today)*20 and is >= 0', () => {
    fc.assert(
      fc.property(fc.array(habitArb, { minLength: 0, maxLength: 50 }), (habits) => {
        const result = calcEcoPoints(habits);

        const expectedStreakPart = habits.reduce((sum, h) => sum + h.streak * 50, 0);
        const expectedTodayPart = habits.filter((h) => h.completed_today).length * 20;
        const expected = expectedStreakPart + expectedTodayPart;

        expect(result).toBe(expected);
        expect(result).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 200 },
    );
  });
});

/**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.5**
 *
 * Property 2: Consistencia de cálculo de nivel
 * For any ecoPoints >= 0, calcLevel(ecoPoints) equals floor(ecoPoints / 100) + 1.
 * Level is always >= 1.
 */
describe('calcLevel — Property 2: Consistencia de cálculo de nivel', () => {
  it('equals floor(ecoPoints / 100) + 1 and is always >= 1', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100_000 }), (ecoPoints) => {
        const result = calcLevel(ecoPoints);
        const expected = Math.floor(ecoPoints / 100) + 1;

        expect(result).toBe(expected);
        expect(result).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 200 },
    );
  });
});

/**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.5**
 *
 * Property 3: Mapeo de títulos cubre todos los rangos
 * For any level >= 1, levelTitle(level) returns exactly one of the 6 defined titles.
 * Ranges are exhaustive and mutually exclusive:
 *   1-4 → Eco Seedling, 5-9 → Eco Sprout, 10-19 → Eco Guardian,
 *   20-34 → Eco Ranger, 35-49 → Eco Legend, 50+ → Eco Master.
 */
describe('levelTitle — Property 3: Mapeo de títulos cubre todos los rangos', () => {
  const VALID_TITLES = [
    'Eco Seedling',
    'Eco Sprout',
    'Eco Guardian',
    'Eco Ranger',
    'Eco Legend',
    'Eco Master',
  ] as const;

  it('returns one of the 6 valid titles for any level >= 1', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10_000 }), (level) => {
        const title = levelTitle(level);
        expect(VALID_TITLES).toContain(title);
      }),
      { numRuns: 200 },
    );
  });

  it('maps level ranges to the correct title', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10_000 }), (level) => {
        const title = levelTitle(level);

        if (level >= 1 && level <= 4) {
          expect(title).toBe('Eco Seedling');
        } else if (level >= 5 && level <= 9) {
          expect(title).toBe('Eco Sprout');
        } else if (level >= 10 && level <= 19) {
          expect(title).toBe('Eco Guardian');
        } else if (level >= 20 && level <= 34) {
          expect(title).toBe('Eco Ranger');
        } else if (level >= 35 && level <= 49) {
          expect(title).toBe('Eco Legend');
        } else {
          expect(title).toBe('Eco Master');
        }
      }),
      { numRuns: 200 },
    );
  });
});

/**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.5**
 *
 * Property 4: Puntos para siguiente nivel siempre positivos
 * For any ecoPoints >= 0, pointsToNextLevel(ecoPoints) returns a value > 0
 * when ecoPoints is not an exact multiple of 100, and returns 100 when
 * ecoPoints is a multiple of 100 (since the level goes up).
 */
describe('pointsToNextLevel — Property 4: Puntos para siguiente nivel siempre positivos', () => {
  it('returns > 0 for non-multiples of 100, and 100 for exact multiples', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100_000 }), (ecoPoints) => {
        const result = pointsToNextLevel(ecoPoints);

        if (ecoPoints % 100 === 0) {
          // At exact multiples, level = ecoPoints/100 + 1, so
          // pointsToNextLevel = level*100 - ecoPoints = (ecoPoints/100 + 1)*100 - ecoPoints = 100
          expect(result).toBe(100);
        } else {
          expect(result).toBeGreaterThan(0);
        }
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Pure optimistic-update transformations (extracted from HabitContext) ─────
// These mirror the inline logic in checkHabit / uncheckHabit callbacks.

function applyCheck(h: Habit): Habit {
  return {
    ...h,
    completed_today: true,
    streak: h.completed_today ? h.streak : h.streak + 1,
    last_7_days: h.completed_today
      ? h.last_7_days
      : [...h.last_7_days.slice(0, 6), true],
  };
}

function applyUncheck(h: Habit): Habit {
  return {
    ...h,
    completed_today: false,
    streak: Math.max(0, h.streak - 1),
    last_7_days: [...h.last_7_days.slice(0, 6), false],
  };
}

/**
 * **Validates: Requirements 5.2, 5.3, 5.4**
 *
 * Property 7: Actualización optimista es reversible (Round-trip)
 * Given a habit state, applying checkHabit followed by uncheckHabit
 * (or vice versa) returns the habit to its original completed_today
 * and streak state (assuming DB doesn't fail).
 */
describe('Optimistic update — Property 7: Actualización optimista es reversible', () => {
  it('check then uncheck restores original completed_today and streak for unchecked habits', () => {
    // Start from an unchecked habit (completed_today: false)
    const uncheckedHabitArb = habitArb.map((h) => ({
      ...h,
      completed_today: false,
    }));

    fc.assert(
      fc.property(uncheckedHabitArb, (habit) => {
        const checked = applyCheck(habit);
        const restored = applyUncheck(checked);

        expect(restored.completed_today).toBe(habit.completed_today);
        expect(restored.streak).toBe(habit.streak);
      }),
      { numRuns: 200 },
    );
  });

  it('uncheck then check restores original completed_today and streak for checked habits', () => {
    // Start from a checked habit (completed_today: true, streak >= 1)
    const checkedHabitArb = habitArb.map((h) => ({
      ...h,
      completed_today: true,
      streak: Math.max(1, h.streak), // streak >= 1 when completed today
    }));

    fc.assert(
      fc.property(checkedHabitArb, (habit) => {
        const unchecked = applyUncheck(habit);
        const restored = applyCheck(unchecked);

        expect(restored.completed_today).toBe(habit.completed_today);
        expect(restored.streak).toBe(habit.streak);
      }),
      { numRuns: 200 },
    );
  });
});

/**
 * **Validates: Requirements 5.2, 5.3, 5.4**
 *
 * Property 10: Racha es no negativa (Invariante)
 * For any habit, streak is always >= 0.
 * Unchecking a habit with streak 0 keeps streak at 0.
 */
describe('Optimistic update — Property 10: Racha es no negativa', () => {
  it('streak is always >= 0 after any check or uncheck operation', () => {
    fc.assert(
      fc.property(habitArb, (habit) => {
        const afterCheck = applyCheck(habit);
        const afterUncheck = applyUncheck(habit);

        expect(afterCheck.streak).toBeGreaterThanOrEqual(0);
        expect(afterUncheck.streak).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 200 },
    );
  });

  it('unchecking a habit with streak 0 keeps streak at 0', () => {
    const zeroStreakHabitArb = habitArb.map((h) => ({
      ...h,
      streak: 0,
    }));

    fc.assert(
      fc.property(zeroStreakHabitArb, (habit) => {
        const afterUncheck = applyUncheck(habit);
        expect(afterUncheck.streak).toBe(0);
      }),
      { numRuns: 200 },
    );
  });
});