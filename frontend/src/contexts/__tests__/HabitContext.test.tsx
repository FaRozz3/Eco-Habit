import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Text, TouchableOpacity, View, Alert } from 'react-native';
import { HabitProvider, useHabits } from '../HabitContext';
import type { Habit } from '../HabitContext';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock localDb (SQLite layer)
const mockInitLocalDb = jest.fn().mockResolvedValue(undefined);
const mockGetFullHabits = jest.fn().mockResolvedValue([]);
const mockCheckHabitToday = jest.fn().mockResolvedValue(undefined);
const mockUncheckHabitToday = jest.fn().mockResolvedValue(undefined);
const mockCreateHabit = jest.fn().mockResolvedValue(undefined);
const mockUpdateHabit = jest.fn().mockResolvedValue(undefined);
const mockDeleteHabit = jest.fn().mockResolvedValue(undefined);

jest.mock('../../services/localDb', () => ({
  initLocalDb: (...args: any[]) => mockInitLocalDb(...args),
  getFullHabits: (...args: any[]) => mockGetFullHabits(...args),
  createHabit: (...args: any[]) => mockCreateHabit(...args),
  updateHabit: (...args: any[]) => mockUpdateHabit(...args),
  deleteHabit: (...args: any[]) => mockDeleteHabit(...args),
  checkHabitToday: (...args: any[]) => mockCheckHabitToday(...args),
  uncheckHabitToday: (...args: any[]) => mockUncheckHabitToday(...args),
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const sampleHabits: Habit[] = [
  {
    id: 1, name: 'Meditar', icon: '🧘', color: '#2ECC71',
    created_at: '2025-01-01T00:00:00Z', streak: 3,
    completed_today: false, last_7_days: [true, true, true, false, false, false, false],
  },
  {
    id: 2, name: 'Ejercicio', icon: '💪', color: '#3498DB',
    created_at: '2025-01-01T00:00:00Z', streak: 7,
    completed_today: true, last_7_days: [true, true, true, true, true, true, true],
  },
];

function TestConsumer() {
  const { habits, checkHabit, uncheckHabit, addHabit, updateHabit, deleteHabit } = useHabits();
  return (
    <View>
      <Text testID="habit-count">{habits.length}</Text>
      {habits.map((h) => (
        <View key={h.id} testID={`habit-${h.id}`}>
          <Text testID={`name-${h.id}`}>{h.name}</Text>
          <Text testID={`streak-${h.id}`}>{h.streak}</Text>
          <Text testID={`completed-${h.id}`}>{h.completed_today ? 'yes' : 'no'}</Text>
          <Text testID={`last7-${h.id}`}>{JSON.stringify(h.last_7_days)}</Text>
          <Text testID={`icon-${h.id}`}>{h.icon}</Text>
          <Text testID={`color-${h.id}`}>{h.color}</Text>
          <TouchableOpacity testID={`check-${h.id}`} onPress={() => checkHabit(h.id)}>
            <Text>Check</Text>
          </TouchableOpacity>
          <TouchableOpacity testID={`uncheck-${h.id}`} onPress={() => uncheckHabit(h.id)}>
            <Text>Uncheck</Text>
          </TouchableOpacity>
          <TouchableOpacity testID={`update-${h.id}`} onPress={() => updateHabit(h.id, { name: 'Updated', icon: '💧', color: '#3498DB' })}>
            <Text>Update</Text>
          </TouchableOpacity>
          <TouchableOpacity testID={`delete-${h.id}`} onPress={() => deleteHabit(h.id)}>
            <Text>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity testID="add-habit" onPress={() => addHabit({ name: 'New Habit', icon: '🌱', color: '#2ECC71' })}>
        <Text>Add</Text>
      </TouchableOpacity>
    </View>
  );
}

function renderWithProvider() {
  return render(
    <HabitProvider>
      <TestConsumer />
    </HabitProvider>,
  );
}

describe('HabitContext - checkHabit optimistic update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockInitLocalDb.mockResolvedValue(undefined);
    mockGetFullHabits.mockResolvedValue(sampleHabits);
    mockCheckHabitToday.mockResolvedValue(undefined);
    mockUncheckHabitToday.mockResolvedValue(undefined);
  });

  it('actualiza el estado local inmediatamente al hacer check', async () => {
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('completed-1')).toBeTruthy(), { timeout: 10000 });

    expect(screen.getByTestId('completed-1').props.children).toBe('no');
    expect(screen.getByTestId('streak-1').props.children).toBe(3);

    await act(async () => { fireEvent.press(screen.getByTestId('check-1')); });

    expect(screen.getByTestId('completed-1').props.children).toBe('yes');
    expect(screen.getByTestId('streak-1').props.children).toBe(4);
    expect(mockCheckHabitToday).toHaveBeenCalledWith(1);
  }, 30000);

  it('revierte el estado si la operación de DB falla', async () => {
    mockCheckHabitToday.mockRejectedValueOnce(new Error('DB error'));
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('completed-1')).toBeTruthy());

    expect(screen.getByTestId('completed-1').props.children).toBe('no');
    expect(screen.getByTestId('streak-1').props.children).toBe(3);

    await act(async () => { fireEvent.press(screen.getByTestId('check-1')); });

    await waitFor(() => {
      expect(screen.getByTestId('completed-1').props.children).toBe('no');
      expect(screen.getByTestId('streak-1').props.children).toBe(3);
    });
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'No se pudo marcar el hábito');
  }, 15000);

  it('no incrementa la racha si ya estaba completado hoy', async () => {
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('completed-2')).toBeTruthy());

    expect(screen.getByTestId('completed-2').props.children).toBe('yes');
    expect(screen.getByTestId('streak-2').props.children).toBe(7);

    await act(async () => { fireEvent.press(screen.getByTestId('check-2')); });

    expect(screen.getByTestId('streak-2').props.children).toBe(7);
    expect(screen.getByTestId('completed-2').props.children).toBe('yes');
  }, 15000);
});

describe('HabitContext - uncheckHabit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockInitLocalDb.mockResolvedValue(undefined);
    mockGetFullHabits.mockResolvedValue(sampleHabits);
    mockCheckHabitToday.mockResolvedValue(undefined);
    mockUncheckHabitToday.mockResolvedValue(undefined);
  });

  it('optimistically decrements streak', async () => {
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('completed-2')).toBeTruthy());

    expect(screen.getByTestId('completed-2').props.children).toBe('yes');
    expect(screen.getByTestId('streak-2').props.children).toBe(7);

    await act(async () => { fireEvent.press(screen.getByTestId('uncheck-2')); });

    expect(screen.getByTestId('completed-2').props.children).toBe('no');
    expect(screen.getByTestId('streak-2').props.children).toBe(6);
    expect(mockUncheckHabitToday).toHaveBeenCalledWith(2);
  }, 15000);

  it('reverts state if uncheck DB call fails', async () => {
    mockUncheckHabitToday.mockRejectedValueOnce(new Error('DB error'));
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('completed-2')).toBeTruthy());

    await act(async () => { fireEvent.press(screen.getByTestId('uncheck-2')); });

    await waitFor(() => {
      expect(screen.getByTestId('completed-2').props.children).toBe('yes');
      expect(screen.getByTestId('streak-2').props.children).toBe(7);
    });
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'No se pudo desmarcar el hábito');
  }, 15000);

  it('does not decrement streak below 0', async () => {
    mockGetFullHabits.mockResolvedValue([{
      id: 3, name: 'Leer', icon: '📖', color: '#E74C3C',
      created_at: '2025-01-01T00:00:00Z', streak: 0,
      completed_today: true, last_7_days: [false, false, false, false, false, false, true],
    }]);

    render(
      <HabitProvider>
        <TestConsumer />
      </HabitProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('streak-3')).toBeTruthy());

    expect(screen.getByTestId('streak-3').props.children).toBe(0);
    expect(screen.getByTestId('completed-3').props.children).toBe('yes');

    await act(async () => { fireEvent.press(screen.getByTestId('uncheck-3')); });

    expect(screen.getByTestId('streak-3').props.children).toBe(0);
    expect(screen.getByTestId('completed-3').props.children).toBe('no');
  }, 15000);
});

describe('HabitContext - last_7_days optimistic update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockInitLocalDb.mockResolvedValue(undefined);
    mockGetFullHabits.mockResolvedValue(sampleHabits);
    mockCheckHabitToday.mockResolvedValue(undefined);
    mockUncheckHabitToday.mockResolvedValue(undefined);
  });

  it('sets last day to true on check', async () => {
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('last7-1')).toBeTruthy());

    // Habit 1 last_7_days: [true, true, true, false, false, false, false]
    const before = JSON.parse(screen.getByTestId('last7-1').props.children);
    expect(before[6]).toBe(false);

    await act(async () => { fireEvent.press(screen.getByTestId('check-1')); });

    const after = JSON.parse(screen.getByTestId('last7-1').props.children);
    expect(after[6]).toBe(true);
    expect(after.length).toBe(7);
  }, 15000);

  it('sets last day to false on uncheck', async () => {
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('last7-2')).toBeTruthy());

    // Habit 2 last_7_days: all true
    const before = JSON.parse(screen.getByTestId('last7-2').props.children);
    expect(before[6]).toBe(true);

    await act(async () => { fireEvent.press(screen.getByTestId('uncheck-2')); });

    const after = JSON.parse(screen.getByTestId('last7-2').props.children);
    expect(after[6]).toBe(false);
    expect(after.length).toBe(7);
  }, 15000);
});

describe('HabitContext - addHabit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockInitLocalDb.mockResolvedValue(undefined);
    mockGetFullHabits.mockResolvedValue(sampleHabits);
    mockCreateHabit.mockResolvedValue({
      id: 10, name: 'New Habit', icon: '🌱', color: '#2ECC71', created_at: '2025-06-01T00:00:00Z',
    });
  });

  it('adds a new habit to the list immediately', async () => {
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('habit-count').props.children).toBe(2));

    await act(async () => { fireEvent.press(screen.getByTestId('add-habit')); });

    expect(screen.getByTestId('habit-count').props.children).toBe(3);
    expect(screen.getByTestId('name-10').props.children).toBe('New Habit');
    expect(screen.getByTestId('streak-10').props.children).toBe(0);
    expect(screen.getByTestId('completed-10').props.children).toBe('no');
  }, 15000);

  it('new habit has 7 empty days', async () => {
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('habit-count').props.children).toBe(2));

    await act(async () => { fireEvent.press(screen.getByTestId('add-habit')); });

    const days = JSON.parse(screen.getByTestId('last7-10').props.children);
    expect(days).toEqual([false, false, false, false, false, false, false]);
  }, 15000);
});

describe('HabitContext - updateHabit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockInitLocalDb.mockResolvedValue(undefined);
    mockGetFullHabits.mockResolvedValue(sampleHabits);
    mockUpdateHabit.mockResolvedValue(undefined);
  });

  it('optimistically updates name, icon, and color', async () => {
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('name-1').props.children).toBe('Meditar'));

    await act(async () => { fireEvent.press(screen.getByTestId('update-1')); });

    expect(screen.getByTestId('name-1').props.children).toBe('Updated');
    expect(screen.getByTestId('icon-1').props.children).toBe('💧');
    expect(screen.getByTestId('color-1').props.children).toBe('#3498DB');
  }, 15000);

  it('reverts on DB failure', async () => {
    mockUpdateHabit.mockRejectedValueOnce(new Error('DB error'));
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('habit-count').props.children).toBe(2), { timeout: 5000 });

    await act(async () => { fireEvent.press(screen.getByTestId('update-1')); });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'No se pudo actualizar el hábito');
    });
    expect(screen.getByTestId('name-1').props.children).toBe('Meditar');
  }, 15000);
});

describe('HabitContext - deleteHabit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockInitLocalDb.mockResolvedValue(undefined);
    mockGetFullHabits.mockResolvedValue(sampleHabits);
    mockDeleteHabit.mockResolvedValue(undefined);
  });

  it('removes habit from list immediately', async () => {
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('habit-count').props.children).toBe(2));

    await act(async () => { fireEvent.press(screen.getByTestId('delete-1')); });

    expect(screen.getByTestId('habit-count').props.children).toBe(1);
    expect(screen.queryByTestId('habit-1')).toBeNull();
  }, 15000);

  it('reverts on DB failure', async () => {
    mockDeleteHabit.mockRejectedValueOnce(new Error('DB error'));
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('habit-count').props.children).toBe(2), { timeout: 5000 });

    await act(async () => { fireEvent.press(screen.getByTestId('delete-1')); });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'No se pudo eliminar el hábito');
    });
    expect(screen.getByTestId('habit-count').props.children).toBe(2);
  }, 15000);
});

describe('HabitContext - SQLite initialization error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('shows a descriptive Alert when initLocalDb fails', async () => {
    mockInitLocalDb.mockRejectedValueOnce(new Error('SQLite open failed'));
    mockGetFullHabits.mockResolvedValue([]);

    renderWithProvider();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'No se pudo inicializar la base de datos local. Por favor reinicia la app. Si el problema persiste, intenta reinstalarla.',
      );
    });
  }, 15000);

  it('does not load habits when DB initialization fails', async () => {
    mockInitLocalDb.mockRejectedValueOnce(new Error('SQLite open failed'));
    mockGetFullHabits.mockResolvedValue(sampleHabits);

    renderWithProvider();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    // Habits should remain empty since dbReady never becomes true
    expect(screen.getByTestId('habit-count').props.children).toBe(0);
    expect(mockGetFullHabits).not.toHaveBeenCalled();
  }, 15000);
});
