/**
 * Theme consistency tests — verifies the dark glass-morphism design spec.
 *
 * Validates: Requirement 8.7
 * THE App SHALL aplicar el tema oscuro glass-morphism de forma consistente
 * en todas las pantallas (fondo #0F1115, tarjetas Glass_Card, gradientes púrpura-verde)
 */

import { colors, glassCard, gradient, radius } from '../theme';

describe('Dark glass-morphism theme constants', () => {
  // ─── Background ──────────────────────────────────────────────────────────
  it('background color is #0F1115', () => {
    expect(colors.background).toBe('#0F1115');
  });

  // ─── Glass Card ──────────────────────────────────────────────────────────
  describe('glassCard', () => {
    it('has a semi-transparent purple-tinted background', () => {
      expect(glassCard.backgroundColor).toBe(colors.cardBg);
      // cardBg should be a low-opacity purple rgba
      expect(colors.cardBg).toBe('rgba(187, 134, 252, 0.03)');
    });

    it('has a purple-tinted border', () => {
      expect(glassCard.borderWidth).toBe(1);
      expect(glassCard.borderColor).toBe(colors.cardBorder);
      expect(colors.cardBorder).toBe('rgba(187, 134, 252, 0.15)');
    });

    it('uses the large border radius (16)', () => {
      expect(glassCard.borderRadius).toBe(radius.lg);
      expect(radius.lg).toBe(16);
    });
  });

  // ─── Gradient (purple → green) ───────────────────────────────────────────
  describe('gradient', () => {
    it('starts with purple (#BB86FC)', () => {
      expect(gradient.start).toBe('#BB86FC');
    });

    it('ends with green (#00f59f)', () => {
      expect(gradient.end).toBe('#00f59f');
    });

    it('colors array matches start/end', () => {
      expect(gradient.colors).toEqual(['#BB86FC', '#00f59f']);
    });
  });

  // ─── Key accent colors ───────────────────────────────────────────────────
  it('primary accent is green (#00f59f)', () => {
    expect(colors.primary).toBe('#00f59f');
  });

  it('secondary accent is purple (#BB86FC)', () => {
    expect(colors.accent).toBe('#BB86FC');
  });
});
