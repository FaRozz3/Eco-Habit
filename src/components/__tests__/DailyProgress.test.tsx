import React from 'react';
import { render, screen } from '@testing-library/react-native';
import DailyProgress from '../DailyProgress';

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: (props: any) => <View {...props} /> };
});

/**
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
describe('DailyProgress', () => {
  it('renders "Daily Goal Progress" header (Req 4.1)', () => {
    render(<DailyProgress completed={2} total={5} />);
    expect(screen.getByText('Daily Goal Progress')).toBeTruthy();
  });

  it('calculates and displays percentage rounded to nearest integer (Req 4.3)', () => {
    render(<DailyProgress completed={1} total={3} />);
    expect(screen.getByText('33%')).toBeTruthy();
  });

  it('displays 100% when all habits completed (Req 4.3)', () => {
    render(<DailyProgress completed={5} total={5} />);
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('shows congratulatory message when all habits completed (Req 4.4)', () => {
    render(<DailyProgress completed={3} total={3} />);
    expect(screen.getByText('All habits completed! 🎉')).toBeTruthy();
  });

  it('shows 0% and prompt when no habits exist (Req 4.5)', () => {
    render(<DailyProgress completed={0} total={0} />);
    expect(screen.getByText('0%')).toBeTruthy();
    expect(screen.getByText('Create your first habit to start tracking!')).toBeTruthy();
  });

  it('shows motivational subtext with remaining count (Req 4.6)', () => {
    render(<DailyProgress completed={2} total={5} />);
    expect(screen.getByText(/Complete 3 more task/)).toBeTruthy();
  });

  it('shows remaining count of 1 (Req 4.6)', () => {
    render(<DailyProgress completed={4} total={5} />);
    expect(screen.getByText(/Complete 1 more task/)).toBeTruthy();
  });

  it('re-renders correctly when props change', () => {
    const { rerender } = render(<DailyProgress completed={1} total={4} />);
    expect(screen.getByText('25%')).toBeTruthy();

    rerender(<DailyProgress completed={3} total={4} />);
    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText(/Complete 1 more task/)).toBeTruthy();
  });
});
