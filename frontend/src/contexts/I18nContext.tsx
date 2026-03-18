import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createT, Locale } from '../i18n';

const STORAGE_KEY = 'ecohabit_locale';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: async () => { },
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'en' || stored === 'es') {
        setLocaleState(stored);
      } else {
        // Fallback to device language
        const deviceLocales = getLocales();
        if (deviceLocales && deviceLocales.length > 0) {
          const deviceLang = deviceLocales[0].languageCode;
          if (deviceLang === 'es' || deviceLang === 'en') {
            setLocaleState(deviceLang);
          }
        }
      }
      setReady(true);
    });
  }, []);

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    await AsyncStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const t = useMemo(() => createT(locale), [locale]);

  if (!ready) return null;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
