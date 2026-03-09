import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Platform } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useAuth } from '../contexts/AuthContext';
import { useWelcome } from '../contexts/WelcomeContext';
import { HabitProvider } from '../contexts/HabitContext';
import { AchievementProvider } from '../contexts/AchievementContext';
import { I18nProvider } from '../contexts/I18nContext';
import OnboardingScreen from '../screens/OnboardingScreen';
import NameScreen from '../screens/NameScreen';
import TodayScreen from '../screens/TodayScreen';
import StatsScreen from '../screens/StatsScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CustomTabBar from '../components/CustomTabBar';
import { colors } from '../theme';

const appDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.tabBar,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

const BottomTab = createBottomTabNavigator();
const TopTab = createMaterialTopTabNavigator();

function MainTabs() {
  if (Platform.OS === 'web') {
    return (
      <BottomTab.Navigator
        tabBar={(props: any) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'fade' as any
        }}
      >
        <BottomTab.Screen name="Today" component={TodayScreen} />
        <BottomTab.Screen name="Stats" component={StatsScreen} />
        <BottomTab.Screen name="Achievements" component={AchievementsScreen} />
        <BottomTab.Screen name="Settings" component={SettingsScreen} />
      </BottomTab.Navigator>
    );
  }

  return (
    <TopTab.Navigator
      tabBar={(props: any) => <CustomTabBar {...props} />}
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
      }}
    >
      <TopTab.Screen name="Today" component={TodayScreen} />
      <TopTab.Screen name="Stats" component={StatsScreen} />
      <TopTab.Screen name="Achievements" component={AchievementsScreen} />
      <TopTab.Screen name="Settings" component={SettingsScreen} />
    </TopTab.Navigator>
  );
}

function AppContent() {
  const { authToken, isLoading: authLoading } = useAuth();
  const { hasSeenOnboarding, hasEnteredName } = useWelcome();

  // Show loading spinner while auth or welcome state is being resolved
  if (authLoading || hasSeenOnboarding === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // First-time user: show onboarding
  if (!hasSeenOnboarding) {
    return (
      <View style={styles.root}>
        <OnboardingScreen />
      </View>
    );
  }

  // Onboarding done but no name yet
  if (!hasEnteredName) {
    return (
      <View style={styles.root}>
        <NameScreen />
      </View>
    );
  }

  // Authenticated and setup complete — show main app
  return (
    <NavigationContainer theme={appDarkTheme}>
      <HabitProvider>
        <AchievementProvider>
          <MainTabs />
        </AchievementProvider>
      </HabitProvider>
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
