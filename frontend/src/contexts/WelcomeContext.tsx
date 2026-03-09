import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_DONE_KEY = 'onboardingDone';
const USER_NAME_KEY = 'userName';

interface WelcomeContextType {
  hasSeenOnboarding: boolean | null; // null = still loading
  hasEnteredName: boolean;
  userName: string;
  markOnboardingDone: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  setUserName: (name: string) => Promise<void>;
}

const WelcomeContext = createContext<WelcomeContextType | undefined>(undefined);

export function WelcomeProvider({ children }: { children: ReactNode }) {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [userName, setUserNameState] = useState<string>('');
  const [hasEnteredName, setHasEnteredName] = useState(false);

  useEffect(() => {
    (async () => {
      const [onboardingVal, nameVal] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_DONE_KEY),
        AsyncStorage.getItem(USER_NAME_KEY),
      ]);
      setHasSeenOnboarding(onboardingVal === 'true');
      if (nameVal) {
        setUserNameState(nameVal);
        setHasEnteredName(true);
      }
    })();
  }, []);

  const markOnboardingDone = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
    setHasSeenOnboarding(true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    await AsyncStorage.removeItem(ONBOARDING_DONE_KEY);
    setHasSeenOnboarding(false);
  }, []);

  const setUserName = useCallback(async (name: string) => {
    await AsyncStorage.setItem(USER_NAME_KEY, name);
    setUserNameState(name);
    setHasEnteredName(true);
  }, []);

  return (
    <WelcomeContext.Provider
      value={{ hasSeenOnboarding, hasEnteredName, userName, markOnboardingDone, resetOnboarding, setUserName }}
    >
      {children}
    </WelcomeContext.Provider>
  );
}

export function useWelcome(): WelcomeContextType {
  const context = useContext(WelcomeContext);
  if (!context) throw new Error('useWelcome must be used within WelcomeProvider');
  return context;
}
