// ─── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  // Core palette
  primary: '#00f59f',
  accent: '#BB86FC',
  background: '#0F1115',

  // Surfaces
  surface: '#161A22',
  surfaceLight: '#1C2130',
  cardBg: 'rgba(187, 134, 252, 0.03)',
  cardBorder: 'rgba(187, 134, 252, 0.15)',

  // Text
  text: '#FFFFFF',
  textSecondary: '#8B95A8',
  textMuted: '#4A5568',
  textAccent: '#00f59f',

  // Status
  error: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  purple: '#BB86FC',
  neonPurple: '#BB86FC',
  primaryNeon: '#00F5A0',
  description: '#94A3B8',

  // UI
  border: 'rgba(187, 134, 252, 0.15)',
  overlay: 'rgba(0,0,0,0.85)',
  tabBar: 'rgba(15, 17, 21, 0.92)',
  progressBg: '#1A2235',
  progressFill: '#00f59f',

  // Glow / effects
  primaryGlow: 'rgba(0, 245, 159, 0.3)',
  accentGlow: 'rgba(187, 134, 252, 0.3)',
  primaryDim: 'rgba(0, 245, 159, 0.15)',
  accentDim: 'rgba(187, 134, 252, 0.15)',
  surfaceGlass: 'rgba(22, 32, 29, 0.4)',
};

// ─── Gradient ────────────────────────────────────────────────────────────────

export const gradient = {
  start: '#BB86FC',
  end: '#00f59f',
  colors: ['#BB86FC', '#00f59f'] as const,
};

// ─── Typography ──────────────────────────────────────────────────────────────

export const fontFamily = 'SpaceGrotesk-Regular';

export const fontFamilies = {
  light: 'SpaceGrotesk-Light',
  regular: 'SpaceGrotesk-Regular',
  medium: 'SpaceGrotesk-Medium',
  semiBold: 'SpaceGrotesk-SemiBold',
  bold: 'SpaceGrotesk-Bold',
};

export const fontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '700' as const, // Space Grotesk max is 700
};

export const typography = {
  h1: { fontFamily: fontFamilies.bold, fontSize: 32, fontWeight: fontWeights.bold },
  h2: { fontFamily: fontFamilies.bold, fontSize: 22, fontWeight: fontWeights.bold },
  h3: { fontFamily: fontFamilies.semiBold, fontSize: 18, fontWeight: fontWeights.semiBold },
  body: { fontFamily: fontFamilies.regular, fontSize: 16, fontWeight: fontWeights.regular },
  bodyBold: { fontFamily: fontFamilies.bold, fontSize: 16, fontWeight: fontWeights.bold },
  caption: { fontFamily: fontFamilies.regular, fontSize: 14, fontWeight: fontWeights.regular },
  small: { fontFamily: fontFamilies.regular, fontSize: 12, fontWeight: fontWeights.regular },
  stat: { fontFamily: fontFamilies.bold, fontSize: 32, fontWeight: fontWeights.bold },
};

// ─── Spacing & Radius ────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// ─── Glass Card Style ────────────────────────────────────────────────────────

export const glassCard = {
  backgroundColor: colors.surfaceGlass,
  borderWidth: 1,
  borderColor: 'rgba(187, 134, 252, 0.2)',
  borderRadius: radius.xl,
};

// ─── Icon Background Helper ──────────────────────────────────────────────────

export function getIconBg(color: string, opacity = 0.2): string {
  // Convert hex to rgba at given opacity
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}


