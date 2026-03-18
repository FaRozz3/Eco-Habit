import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_DONE_KEY = 'onboardingDone';
const USER_NAME_KEY = 'userName';
const USER_AVATAR_KEY = 'userAvatar';

interface WelcomeContextType {
  hasSeenOnboarding: boolean | null; // null = still loading
  hasEnteredName: boolean;
  userName: string;
  avatarUri: string | null;
  markOnboardingDone: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  setUserName: (name: string) => Promise<void>;
  setAvatarUri: (uri: string | null) => Promise<void>;
}

const WelcomeContext = createContext<WelcomeContextType | undefined>(undefined);

export function WelcomeProvider({ children }: { children: ReactNode }) {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [userName, setUserNameState] = useState<string>('');
  const [avatarUri, setAvatarUriState] = useState<string | null>(null);
  const [hasEnteredName, setHasEnteredName] = useState(false);

  useEffect(() => {
    (async () => {
      const [onboardingVal, nameVal, avatarVal] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_DONE_KEY),
        AsyncStorage.getItem(USER_NAME_KEY),
        AsyncStorage.getItem(USER_AVATAR_KEY),
      ]);
      setHasSeenOnboarding(onboardingVal === 'true');
      if (nameVal) {
        setUserNameState(nameVal);
        setHasEnteredName(true);
      }
      if (avatarVal) {
        setAvatarUriState(avatarVal);
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

  const setAvatarUri = useCallback(async (uri: string | null) => {
    setAvatarUriState(uri);
    if (uri) {
      await AsyncStorage.setItem(USER_AVATAR_KEY, uri);
    } else {
      await AsyncStorage.removeItem(USER_AVATAR_KEY);
    }
  }, []);

  return (
    <WelcomeContext.Provider
      value={{ hasSeenOnboarding, hasEnteredName, userName, avatarUri, markOnboardingDone, resetOnboarding, setUserName, setAvatarUri }}
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
