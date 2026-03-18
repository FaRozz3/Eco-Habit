import React from 'react';
import { render, screen } from '@testing-library/react-native';
import StatsScreen from '../StatsScreen';

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

describe('StatsScreen — empty state (Req 8.2)', () => {
  it('shows zero values in stat cards', () => {
    render(<StatsScreen />);
    expect(screen.getByText('0d')).toBeTruthy();
    expect(screen.getByText('0/0')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
  });

  it('shows motivational message', () => {
    render(<StatsScreen />);
    expect(screen.getByText('No stats yet')).toBeTruthy();
    expect(screen.getByText('Start tracking habits to see your stats grow!')).toBeTruthy();
  });

  it('does not show Active Streaks section', () => {
    render(<StatsScreen />);
    expect(screen.queryByText('Active Streaks')).toBeNull();
  });
});
