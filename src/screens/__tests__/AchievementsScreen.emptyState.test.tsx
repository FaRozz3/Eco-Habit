import React from 'react';
import { render, screen } from '@testing-library/react-native';
import AchievementsScreen from '../AchievementsScreen';

jest.mock('../../contexts/HabitContext', () => ({
  useHabits: () => ({ habits: [] }),
  calcEcoPoints: () => 0,
  calcLevel: () => 1,
  levelTitle: () => 'Eco Seedling',
  pointsToNextLevel: () => 100,
}));

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: (props: any) => <View {...props} /> };
});

describe('AchievementsScreen — empty state (Req 8.3)', () => {
  it('shows 0 unlocked out of total badges', () => {
    render(<AchievementsScreen />);
    expect(screen.getByText(/^0\/\d+ unlocked$/)).toBeTruthy();
  });

  it('shows all badges as locked', () => {
    render(<AchievementsScreen />);
    const locks = screen.getAllByText('🔒');
    expect(locks.length).toBe(26);
  });

  it('shows level 1 and Eco Seedling title', () => {
    render(<AchievementsScreen />);
    expect(screen.getByText('Lv.1')).toBeTruthy();
    expect(screen.getAllByText('Eco Seedling').length).toBeGreaterThanOrEqual(1);
  });

  it('shows 0 Eco Points', () => {
    render(<AchievementsScreen />);
    expect(screen.getByText(/0 Eco Points/)).toBeTruthy();
  });
});
