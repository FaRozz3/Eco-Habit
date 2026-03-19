import fc from 'fast-check';
import en from '../en.json';
import es from '../es.json';

/**
 * **Validates: Requirements 9.1, 9.5**
 *
 * Property 8: Completitud de traducciones
 * For each key present in en.json, the same key exists in es.json with a
 * non-empty string value, and vice versa. Both files have exactly the same
 * set of keys.
 */
describe('Translations — Property 8: Completitud de traducciones', () => {
  const enRecord = en as Record<string, string>;
  const esRecord = es as Record<string, string>;
  const enKeys = Object.keys(enRecord);
  const esKeys = Object.keys(esRecord);

  it('both translation files have the same set of keys', () => {
    const enSet = new Set(enKeys);
    const esSet = new Set(esKeys);

    const missingInEs = enKeys.filter((k) => !esSet.has(k));
    const missingInEn = esKeys.filter((k) => !enSet.has(k));

    expect(missingInEs).toEqual([]);
    expect(missingInEn).toEqual([]);
  });

  it('all English values are non-empty strings', () => {
    for (const [, value] of Object.entries(enRecord)) {
      expect(typeof value).toBe('string');
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  it('all Spanish values are non-empty strings', () => {
    for (const [, value] of Object.entries(esRecord)) {
      expect(typeof value).toBe('string');
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  it('a random key from en.json exists in es.json with a non-empty value', () => {
    expect(enKeys.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: enKeys.length - 1 }),
        (index) => {
          const key = enKeys[index];

          // Key must exist in es.json
          expect(key in esRecord).toBe(true);

          // Value must be a non-empty string
          const value = esRecord[key];
          expect(typeof value).toBe('string');
          expect(value.trim().length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('a random key from es.json exists in en.json with a non-empty value', () => {
    expect(esKeys.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: esKeys.length - 1 }),
        (index) => {
          const key = esKeys[index];

          // Key must exist in en.json
          expect(key in enRecord).toBe(true);

          // Value must be a non-empty string
          const value = enRecord[key];
          expect(typeof value).toBe('string');
          expect(value.trim().length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 200 },
    );
  });
});
