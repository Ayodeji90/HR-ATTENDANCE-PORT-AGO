/**
 * GeoTrackHR mobile design tokens — mirrors the admin dashboard's Tailwind
 * palette (primary red + charcoal "ink" neutrals) so both clients feel like
 * the same product.
 */

export const colors = {
  primary: {
    50: '#FDF2F3',
    100: '#FCE4E6',
    200: '#FACDD1',
    300: '#F5A7AE',
    400: '#EC7580',
    500: '#DC3545',
    600: '#C10726',
    700: '#9E0620',
    800: '#7D0A1E',
    900: '#5C0A19',
  },
  ink: {
    50: '#F7F7F8',
    100: '#EDEDEF',
    200: '#D9D9DC',
    300: '#B7B7BC',
    400: '#8E8E95',
    500: '#6B6B70',
    600: '#525256',
    700: '#3C3C3E',
    800: '#303032',
    900: '#1F1F21',
    950: '#131314',
  },
  success: {
    100: '#DCF5E4',
    500: '#22A85E',
    600: '#178A4A',
    700: '#116B39',
  },
  warning: {
    100: '#FEECC7',
    500: '#DB8A15',
    600: '#B36C0E',
  },
  info: {
    100: '#DBEAFE',
    500: '#3576D6',
    600: '#265CAD',
  },
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 9999,
} as const;

export const typography = {
  title: { fontSize: 22, fontWeight: '700' as const, color: colors.ink[900] },
  section: { fontSize: 16, fontWeight: '600' as const, color: colors.ink[800] },
  body: { fontSize: 14, color: colors.ink[700] },
  small: { fontSize: 12, color: colors.ink[500] },
  caption: { fontSize: 11, color: colors.ink[400], textTransform: 'uppercase' as const, letterSpacing: 0.6, fontWeight: '600' as const },
} as const;
