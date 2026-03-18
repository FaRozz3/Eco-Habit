import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import AddHabitModal from '../AddHabitModal';

jest.mock('react-native/Libraries/Alert/Alert', () => ({ alert: jest.fn() }));

describe('AddHabitModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onAdd: jest.fn().mockResolvedValue(undefined),
  };
  beforeEach(() => { jest.clearAllMocks(); });

  it('shows validation when name empty', async () => {
    render(<AddHabitModal {...defaultProps} />);
    await act(async () => { fireEvent.press(screen.getByText('Create')); });
    expect(screen.getByText('Name cannot be empty')).toBeTruthy();
  });

  it('does not call onAdd when name empty', async () => {
    const onAdd = jest.fn().mockResolvedValue(undefined);
    render(<AddHabitModal {...defaultProps} onAdd={onAdd} />);
    await act(async () => { fireEvent.press(screen.getByText('Create')); });
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('calls onAdd with valid data', async () => {
    const onAdd = jest.fn().mockResolvedValue(undefined);
    render(<AddHabitModal {...defaultProps} onAdd={onAdd} />);
    fireEvent.changeText(screen.getByPlaceholderText('Habit name'), 'Ejercicio');
    await act(async () => { fireEvent.press(screen.getByText('Create')); });
    expect(onAdd).toHaveBeenCalledWith({ name: 'Ejercicio', icon: '🌱', color: '#2ECC71' });
  });

  it('calls onAdd with selected icon', async () => {
    const onAdd = jest.fn().mockResolvedValue(undefined);
    render(<AddHabitModal {...defaultProps} onAdd={onAdd} />);
    fireEvent.changeText(screen.getByPlaceholderText('Habit name'), 'Leer');
    fireEvent.press(screen.getByTestId('icon-📖'));
    await act(async () => { fireEvent.press(screen.getByText('Create')); });
    expect(onAdd).toHaveBeenCalledWith({ name: 'Leer', icon: '📖', color: '#2ECC71' });
  });

  it('clears error when typing', async () => {
    render(<AddHabitModal {...defaultProps} />);
    await act(async () => { fireEvent.press(screen.getByText('Create')); });
    expect(screen.getByText('Name cannot be empty')).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText('Habit name'), 'N');
    expect(screen.queryByText('Name cannot be empty')).toBeNull();
  });

  it('shows edit mode UI', () => {
    render(<AddHabitModal {...defaultProps} editMode initialData={{ name: 'Agua', icon: '💧', color: '#3498DB', goal: 'Drink 2L' }} />);
    expect(screen.getByText('Edit Habit')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
    expect(screen.getByDisplayValue('Agua')).toBeTruthy();
  });
});
