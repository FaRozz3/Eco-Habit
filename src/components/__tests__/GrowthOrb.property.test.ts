import fc from 'fast-check';
import { getOrbStage } from '../GrowthOrb';

/**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
 *
 * Property 5: Evolución del orbe cubre todos los niveles
 * For any level >= 1, getOrbStage(level) returns a valid OrbStage with
 * a non-null icon component, glowOpacity between 0.2 and 0.7, and at
 * least one color in glowColors. The level ranges are exhaustive.
 */
describe('getOrbStage — Property 5: Evolución del orbe cubre todos los niveles', () => {
  it('returns a valid OrbStage for any level >= 1', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10_000 }), (level) => {
        const stage = getOrbStage(level);

        // icon must be a non-null function (React component)
        expect(stage.icon).toBeDefined();
        expect(typeof stage.icon).toBe('function');

        // glowOpacity must be between 0.2 and 0.7 inclusive
        expect(stage.glowOpacity).toBeGreaterThanOrEqual(0.2);
        expect(stage.glowOpacity).toBeLessThanOrEqual(0.7);

        // glowColors must have at least one color
        expect(Array.isArray(stage.glowColors)).toBe(true);
        expect(stage.glowColors.length).toBeGreaterThanOrEqual(1);

        // each color must be a valid hex color string
        for (const color of stage.glowColors) {
          expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('maps level ranges to the correct stages exhaustively', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10_000 }), (level) => {
        const stage = getOrbStage(level);

        if (level >= 50) {
          expect(stage.glowOpacity).toBe(0.7);
          expect(stage.glowColors).toHaveLength(6);
        } else if (level >= 35) {
          expect(stage.glowOpacity).toBe(0.6);
          expect(stage.glowColors).toHaveLength(3);
        } else if (level >= 20) {
          expect(stage.glowOpacity).toBe(0.5);
          expect(stage.glowColors).toHaveLength(2);
        } else if (level >= 10) {
          expect(stage.glowOpacity).toBe(0.4);
          expect(stage.glowColors).toHaveLength(2);
        } else if (level >= 5) {
          expect(stage.glowOpacity).toBe(0.3);
          expect(stage.glowColors).toHaveLength(1);
        } else {
          // levels 1-4
          expect(stage.glowOpacity).toBe(0.2);
          expect(stage.glowColors).toHaveLength(1);
        }
      }),
      { numRuns: 200 },
    );
  });
});
