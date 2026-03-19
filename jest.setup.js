// Ensure structuredClone is available globally (needed by expo runtime)
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Mock the expo import meta registry
if (typeof globalThis.__ExpoImportMetaRegistry === 'undefined') {
  globalThis.__ExpoImportMetaRegistry = { url: 'file:///test' };
}

// Global mock for AsyncStorage (used by I18nContext and other contexts)
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    multiGet: jest.fn().mockResolvedValue([]),
    multiSet: jest.fn().mockResolvedValue(undefined),
  },
}));

// Global mock for I18nContext — provides English translations synchronously
jest.mock('./src/contexts/I18nContext', () => {
  const React = require('react');
  const en = require('./src/i18n/en.json');

  function t(key, params) {
    let value = en[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return value;
  }

  return {
    I18nProvider: ({ children }) => children,
    useI18n: () => ({ locale: 'en', setLocale: jest.fn(), t }),
  };
});
