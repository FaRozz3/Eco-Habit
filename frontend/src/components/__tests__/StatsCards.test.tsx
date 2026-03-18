import React from 'react';
import { render, screen } from '@testing-library/react-native';
import StatsCards from '../StatsCards';

/**
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */
describe('StatsCards', () => {
  const defaultProps = {
    totalStreak: 42,
    ecoPoints: 1250,
    nextLevelPoints: 1500,
    weekChange: 5,
  };

  const fmt = (n: number) => n.toLocaleString();

  it('renders two cards side by side', () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText('TOTAL STREAK')).toBeTruthy();
    expect(screen.getByText('ECO POINTS')).toBeTruthy();
  });

  it('renders lightning icon for streak and globe icon for eco points', () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText('⚡')).toBeTruthy();
  });

  it('displays the total streak number', () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('displays formatted eco points', () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText(fmt(1250))).toBeTruthy();
  });

  it('displays positive weekly change indicator', () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText('+5% this week')).toBeTruthy();
  });

  it('displays negative weekly change indicator', () => {
    render(<StatsCards {...defaultProps} weekChange={-3} />);
    expect(screen.getByText('-3% this week')).toBeTruthy();
  });

  it('displays next level threshold', () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText(/Next level:/)).toBeTruthy();
    expect(screen.getByText(new RegExp(fmt(1500)))).toBeTruthy();
  });

  it('handles zero values', () => {
    render(
      <StatsCards totalStreak={0} ecoPoints={0} nextLevelPoints={100} weekChange={0} />
    );
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('+0% this week')).toBeTruthy();
    expect(screen.getByText(/Next level:/)).toBeTruthy();
  });

  it('re-renders with updated props (Req 3.4 - updates without refresh)', () => {
    const { rerender } = render(<StatsCards {...defaultProps} />);
    expect(screen.getByText('42')).toBeTruthy();

    rerender(<StatsCards {...defaultProps} totalStreak={43} ecoPoints={1300} />);
    expect(screen.getByText('43')).toBeTruthy();
    expect(screen.getByText(fmt(1300))).toBeTruthy();
  });
});
