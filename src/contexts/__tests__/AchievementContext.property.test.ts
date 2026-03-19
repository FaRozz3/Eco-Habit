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

import { evaluateBadges } from '../AchievementContext';
import type { Habit } from '../HabitContext';

// ─── Generators ─────────────────────────────────────────────────────────────
const ICONS = ['🌿', '💪', '📖', '🧘', '💧', '🏃', '🎯', '🔥'];
const COLORS = ['#2ECC71', '#3498DB', '#E74C3C', '#9B59B6', '#F39C12', '#1ABC9C', '#E67E22'];

const habitArb: fc.Arbitrary<Habit> = fc.record({
  id: fc.integer({ min: 1, max: 10_000 }),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  icon: fc.constantFrom(...ICONS),
  color: fc.constantFrom(...COLORS),
  created_at: fc.constant('2025-01-01T00:00:00Z'),
  streak: fc.integer({ min: 0, max: 500 }),
  completed_today: fc.boolean(),
  last_7_days: fc.array(fc.boolean(), { minLength: 7, maxLength: 7 }),
});

/**
 * New habit with streak > 0 and completed_today = true.
 * completed_today must be true so the "Perfect Day" badge (earned when ALL
 * habits are completed today) is not lost by introducing an incomplete habit.
 */
const positiveHabitArb: fc.Arbitrary<Habit> = fc.record({
  id: fc.integer({ min: 10_001, max: 20_000 }),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  icon: fc.constantFrom(...ICONS),
  color: fc.constantFrom(...COLORS),
  created_at: fc.constant('2025-01-01T00:00:00Z'),
  streak: fc.integer({ min: 1, max: 500 }),
  completed_today: fc.constant(true),
  last_7_days: fc.array(fc.boolean(), { minLength: 7, maxLength: 7 }),
});

function countEarned(habits: Habit[]): number {
  return evaluateBadges(habits).filter((b) => b.earned).length;
}

/**
 * **Validates: Requirements 4.1**
 *
 * Property 6: Insignias son monótonamente crecientes (Metamórfica)
 *
 * If you add a habit with streak > 0 to a list of habits, the number of
 * earned badges in evaluateBadges(habitsExtended) is >= the number of
 * earned badges in evaluateBadges(habitsOriginal).
 */
describe('evaluateBadges — Property 6: Insignias son monótonamente crecientes', () => {
  it('adding a habit with streak > 0 never decreases the number of earned badges', () => {
    fc.assert(
      fc.property(
        fc.array(habitArb, { minLength: 0, maxLength: 20 }),
        positiveHabitArb,
        (originalHabits, newHabit) => {
          const earnedBefore = countEarned(originalHabits);
          const extended = [...originalHabits, newHabit];
          const earnedAfter = countEarned(extended);

          expect(earnedAfter).toBeGreaterThanOrEqual(earnedBefore);
        },
      ),
      { numRuns: 200 },
    );
  });
});
