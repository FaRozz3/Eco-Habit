import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import AchievementToast from '../AchievementToast';

/**
 * Validates: Requirements 4.2
 * AchievementToast shows badge icon and name when a new badge is unlocked
 */
describe('AchievementToast', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('renders nothing when not visible', () => {
    const { toJSON } = render(
      <AchievementToast icon="🌱" label="First Sprout" visible={false} onHide={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders badge icon and label when visible', () => {
    render(
      <AchievementToast icon="🌱" label="First Sprout" visible={true} onHide={jest.fn()} />
    );
    expect(screen.getByText('🌱')).toBeTruthy();
    expect(screen.getByText('First Sprout')).toBeTruthy();
    expect(screen.getByText('Achievement Unlocked!')).toBeTruthy();
  });

  it('calls onHide after 3 seconds (auto-dismiss)', () => {
    const onHide = jest.fn();
    render(
      <AchievementToast icon="🔥" label="First Spark" visible={true} onHide={onHide} />
    );
    act(() => { jest.advanceTimersByTime(2999); });
    expect(onHide).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(301); });
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('displays different badge icons and labels correctly', () => {
    render(
      <AchievementToast icon="💎" label="Diamond Week" visible={true} onHide={jest.fn()} />
    );
    expect(screen.getByText('💎')).toBeTruthy();
    expect(screen.getByText('Diamond Week')).toBeTruthy();
  });
});
