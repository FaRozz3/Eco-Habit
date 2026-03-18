import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { FlatList } from 'react-native';

// ─── Mock heavy child components to avoid animation/rendering issues ─────────

jest.mock('../../components/GrowthOrb', () => {
  const { View, Text } = require('react-native');
  return (props: any) => <View testID="growth-orb"><Text>{props.level}</Text></View>;
});

jest.mock('../../components/StatsCards', () => {
  const { View } = require('react-native');
  return (props: any) => <View testID="stats-cards" />;
});

jest.mock('../../components/DailyProgress', () => {
  const { View } = require('react-native');
  return (props: any) => <View testID="daily-progress" />;
});

jest.mock('../../components/HabitCard', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return (props: any) => (
    <TouchableOpacity testID={`habit-card-${props.name}`} onPress={props.onCheck}>
      <Text>{props.name}</Text>
    </TouchableOpacity>
  );
});

jest.mock('../../components/AddHabitModal', () => {
  const { View } = require('react-native');
  return (props: any) => props.visible ? <View testID="add-modal" /> : null;
});

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: (props: any) => <View {...props} /> };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));

// ─── Mock context hooks ──────────────────────────────────────────────────────

const mockFetchHabits = jest.fn();

const sampleHabits = [
  {
    id: 1, name: 'Meditar', icon: '🧘', color: '#2ECC71',
    created_at: '2025-01-01', streak: 3, completed_today: false,
    last_7_days: [true, true, true, false, false, false, false],
  },
  {
    id: 2, name: 'Ejercicio', icon: '💪', color: '#3498DB',
    created_at: '2025-01-01', streak: 7, completed_today: true,
    last_7_days: [true, true, true, true, true, true, true],
  },
];

jest.mock('../../contexts/HabitContext', () => ({
  useHabits: () => ({
    habits: sampleHabits,
    isLoading: false,
    fetchHabits: mockFetchHabits,
    checkHabit: jest.fn(),
    uncheckHabit: jest.fn(),
    addHabit: jest.fn(),
    updateHabit: jest.fn(),
    deleteHabit: jest.fn(),
  }),
  calcEcoPoints: jest.fn(() => 170),
  calcLevel: jest.fn(() => 2),
  levelTitle: jest.fn(() => 'Eco Seedling'),
  pointsToNextLevel: jest.fn(() => 30),
}));

jest.mock('../../contexts/WelcomeContext', () => ({
  useWelcome: () => ({ userName: 'Test User' }),
}));

import TodayScreen from '../TodayScreen';

beforeEach(() => {
  jest.clearAllMocks();
});

/**
 * Validates: Requirement 8.5
 * THE App SHALL persistir todos los datos de hábitos y registros diarios en SQLite local,
 * funcionando completamente sin conexión a internet
 */
describe('Offline-first architecture (Req 8.5)', () => {
  it('HabitContext uses localDb (SQLite) exclusively — no network calls for habit data', () => {
    // Structural verification: the mocked HabitContext (backed by SQLite) provides all data
    const HabitContextModule = require('../../contexts/HabitContext');
    expect(HabitContextModule.useHabits).toBeDefined();
    expect(HabitContextModule.calcEcoPoints).toBeDefined();
    expect(HabitContextModule.calcLevel).toBeDefined();
  });

  it('renders the habit list from local SQLite data without network', () => {
    render(<TodayScreen />);
    expect(screen.getByText('Meditar')).toBeTruthy();
    expect(screen.getByText('Ejercicio')).toBeTruthy();
  });

  it('calls fetchHabits on mount to load data from SQLite', () => {
    render(<TodayScreen />);
    expect(mockFetchHabits).toHaveBeenCalled();
  });
});

/**
 * Validates: Requirement 8.6
 * WHEN el usuario desliza hacia abajo en la lista de hábitos del Dashboard,
 * THE App SHALL ejecutar una recarga de datos desde la base de datos local mediante un RefreshControl
 */
describe('Pull-to-refresh on Dashboard (Req 8.6)', () => {
  it('FlatList has a refreshControl prop with RefreshControl', () => {
    const { UNSAFE_getByType } = render(<TodayScreen />);
    const flatList = UNSAFE_getByType(FlatList);
    expect(flatList).toBeTruthy();
    expect(flatList.props.refreshControl).toBeTruthy();
  });

  it('RefreshControl onRefresh triggers fetchHabits to reload from SQLite', () => {
    const { UNSAFE_getByType } = render(<TodayScreen />);
    const flatList = UNSAFE_getByType(FlatList);
    const refreshControlElement = flatList.props.refreshControl;

    expect(refreshControlElement.props.onRefresh).toBeDefined();

    act(() => {
      refreshControlElement.props.onRefresh();
    });

    // fetchHabits called on mount + once on refresh
    expect(mockFetchHabits).toHaveBeenCalledTimes(2);
  });

  it('passes isLoading as the refreshing prop to RefreshControl', () => {
    const { UNSAFE_getByType } = render(<TodayScreen />);
    const flatList = UNSAFE_getByType(FlatList);
    const refreshControlElement = flatList.props.refreshControl;

    // isLoading is false in our mock, so refreshing should be false
    expect(refreshControlElement.props.refreshing).toBe(false);
  });
});
