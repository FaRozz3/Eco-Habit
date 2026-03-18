import en from './en.json';
import es from './es.json';

export type Locale = 'en' | 'es';

export type TranslationKey = keyof typeof en;

const dictionaries: Record<Locale, Record<string, string>> = { en, es };

/**
 * Returns a translator function bound to the given locale.
 * Supports simple `{name}` / `{count}` interpolation.
 */
export function createT(locale: Locale) {
  const dict = dictionaries[locale];
  return (key: string, params?: Record<string, string | number>): string => {
    let value = dict[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return value;
  };
}
