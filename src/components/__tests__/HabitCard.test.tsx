import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import HabitCard from '../HabitCard';

/**
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
describe('HabitCard', () => {
  const defaultProps = {
    name: 'Meditar',
    streak: 5,
    completedToday: false,
    onCheck: jest.fn(),
    icon: '🧘',
    color: '#2ECC71',
  };

  beforeEach(() => { jest.clearAllMocks(); });

  it('renderiza el nombre del hábito', () => {
    render(<HabitCard {...defaultProps} />);
    expect(screen.getByText('Meditar')).toBeTruthy();
  });

  it('renderiza el conteo de racha', () => {
    render(<HabitCard {...defaultProps} />);
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('DAY STREAK')).toBeTruthy();
  });

  it('muestra racha de 1', () => {
    render(<HabitCard {...defaultProps} streak={1} />);
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('renderiza el botón de check', () => {
    render(<HabitCard {...defaultProps} />);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('llama a onCheck cuando se presiona el botón', async () => {
    const onCheck = jest.fn();
    render(<HabitCard {...defaultProps} onCheck={onCheck} />);
    await act(async () => { fireEvent.press(screen.getByRole('button')); });
    expect(onCheck).toHaveBeenCalledTimes(1);
  });

  it('renderiza el icono del hábito (mapped symbol)', () => {
    render(<HabitCard {...defaultProps} />);
    expect(screen.getByText('◎')).toBeTruthy();
  });

  it('renderiza goal subtitle cuando se proporciona', () => {
    render(<HabitCard {...defaultProps} goal="10 minutes daily" />);
    expect(screen.getByText('Goal: 10 minutes daily')).toBeTruthy();
  });

  it('renders 7 progress dots', () => {
    const last7Days = [true, false, true, true, false, true, false];
    render(<HabitCard {...defaultProps} last7Days={last7Days} />);
    for (let i = 0; i < 7; i++) {
      expect(screen.getByTestId(`dot-${i}`)).toBeTruthy();
    }
  });

  it('renders default 7 dots when last7Days is not provided', () => {
    render(<HabitCard {...defaultProps} />);
    for (let i = 0; i < 7; i++) {
      expect(screen.getByTestId(`dot-${i}`)).toBeTruthy();
    }
  });

  it('calls onLongPress when long-pressed', async () => {
    const onLongPress = jest.fn();
    render(<HabitCard {...defaultProps} onLongPress={onLongPress} />);
    await act(async () => { fireEvent(screen.getByRole('button'), 'longPress'); });
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('does not crash when onLongPress is not provided', async () => {
    render(<HabitCard {...defaultProps} />);
    await act(async () => { fireEvent(screen.getByRole('button'), 'longPress'); });
  });
});
