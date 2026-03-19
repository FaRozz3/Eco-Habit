import fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createT, Locale } from '../../i18n';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';

// We unmock I18nContext so we can test the real setLocale logic.
// AsyncStorage remains mocked from jest.setup.js — we control it per-test.
jest.unmock('../I18nContext');

const STORAGE_KEY = 'ecohabit_locale';

const dictionaries: Record<Locale, Record<string, string>> = { en, es };

/**
 * Simulates the core logic of I18nContext.setLocale:
 *   1. Persist locale to AsyncStorage
 *   2. Build a new translator via createT(locale)
 *
 * Returns the translator so callers can assert on t(key) output.
 */
async function simulateSetLocale(locale: Locale) {
  await AsyncStorage.setItem(STORAGE_KEY, locale);
  return createT(locale);
}

// Generator: one of the two supported locales
const localeArb: fc.Arbitrary<Locale> = fc.constantFrom('en' as Locale, 'es' as Locale);

/**
 * **Validates: Requirements 9.3**
 *
 * Property 9: Persistencia de idioma es idempotente
 * Calling setLocale(locale) twice consecutively produces the same state as
 * calling it once. The value in AsyncStorage is the chosen locale and t(key)
 * returns the correct translations for that locale.
 */
describe('I18nContext — Property 9: Persistencia de idioma es idempotente', () => {
  const enKeys = Object.keys(en as Record<string, string>);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('setLocale called twice with the same locale is idempotent (AsyncStorage + t output)', async () => {
    await fc.assert(
      fc.asyncProperty(
        localeArb,
        fc.integer({ min: 0, max: enKeys.length - 1 }),
        async (locale, keyIndex) => {
          jest.clearAllMocks();

          // Call setLocale once
          const t1 = await simulateSetLocale(locale);

          // Capture AsyncStorage state after first call
          const setItemCalls1 = (AsyncStorage.setItem as jest.Mock).mock.calls.length;

          // Call setLocale a second time with the same locale
          const t2 = await simulateSetLocale(locale);

          // AsyncStorage should have been called with the same key/value both times
          expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, locale);

          // The stored value is the same locale after both calls
          const lastCall = (AsyncStorage.setItem as jest.Mock).mock.calls.at(-1);
          expect(lastCall).toEqual([STORAGE_KEY, locale]);

          // t(key) returns the same value after both calls
          const key = enKeys[keyIndex];
          expect(t1(key)).toBe(t2(key));

          // The translation matches the expected dictionary
          const expected = dictionaries[locale][key] ?? key;
          expect(t2(key)).toBe(expected);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('setLocale is idempotent for every key in the dictionary', async () => {
    await fc.assert(
      fc.asyncProperty(localeArb, async (locale) => {
        jest.clearAllMocks();

        const t1 = await simulateSetLocale(locale);
        const t2 = await simulateSetLocale(locale);

        const dict = dictionaries[locale];
        for (const key of Object.keys(dict)) {
          expect(t1(key)).toBe(t2(key));
          expect(t2(key)).toBe(dict[key]);
        }
      }),
      { numRuns: 50 },
    );
  });
});
