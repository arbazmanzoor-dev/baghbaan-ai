/**
 * Design tokens extracted from the Google Stitch export (design/baghbaan_ai/DESIGN.md and the
 * Tailwind config embedded in each screen). Light values are the Stitch tokens verbatim; dark
 * values come from design/diagnosis_result_apple_scab_dark_mode.
 */

export type StatusTone = 'healthy' | 'disease' | 'warning';

export type ColorScheme = {
  background: string;
  surface: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  cardBorder: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  primaryFixed: string;
  onPrimaryFixedVariant: string;
  secondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  secondaryFixed: string;
  onSecondaryFixedVariant: string;
  tertiary: string;
  tertiaryContainer: string;
  error: string;
  errorContainer: string;
  onErrorContainer: string;
  scrim: string;
  status: Record<StatusTone, { accent: string; background: string; border: string; text: string }>;
};

export const lightColors: ColorScheme = {
  background: '#fbf9f4',
  surface: '#fbf9f4',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f5f3ee',
  surfaceContainer: '#f0eee9',
  surfaceContainerHigh: '#eae8e3',
  surfaceContainerHighest: '#e4e2dd',
  onSurface: '#1b1c19',
  onSurfaceVariant: '#414941',
  outline: '#717970',
  outlineVariant: '#c1c9be',
  cardBorder: '#ede7dc',
  primary: '#164525',
  onPrimary: '#ffffff',
  primaryContainer: '#2f5d3a',
  onPrimaryContainer: '#a1d4a8',
  primaryFixed: '#bbefc1',
  onPrimaryFixedVariant: '#22502e',
  secondary: '#006d37',
  secondaryContainer: '#7bf8a1',
  onSecondaryContainer: '#007239',
  secondaryFixed: '#7efba4',
  onSecondaryFixedVariant: '#005228',
  tertiary: '#7f0403',
  tertiaryContainer: '#a12218',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  scrim: 'rgba(0, 0, 0, 0.45)',
  status: {
    healthy: { accent: '#27ae60', background: '#e8f8f0', border: '#27ae60', text: '#1a6337' },
    disease: { accent: '#c0392b', background: '#fdedec', border: '#c0392b', text: '#922b21' },
    warning: { accent: '#d68910', background: '#fef9e7', border: '#d68910', text: '#9a630b' },
  },
};

export const darkColors: ColorScheme = {
  background: '#121614',
  surface: '#121614',
  surfaceContainerLowest: '#1e2621', // cards
  surfaceContainerLow: '#181e1a',
  surfaceContainer: '#25312a', // wells and tracks inside cards
  surfaceContainerHigh: '#2d3a32',
  surfaceContainerHighest: '#36443b',
  onSurface: '#f9fafb',
  onSurfaceVariant: '#b4bdb6',
  outline: '#8a948c',
  outlineVariant: '#3a463e',
  cardBorder: '#2a352e',
  primary: '#a1d4a8',
  onPrimary: '#00210b',
  primaryContainer: '#2f5d3a',
  onPrimaryContainer: '#bbefc1',
  primaryFixed: '#22502e',
  onPrimaryFixedVariant: '#bbefc1',
  secondary: '#34d399',
  secondaryContainer: '#14532d',
  onSecondaryContainer: '#7efba4',
  secondaryFixed: '#14532d',
  onSecondaryFixedVariant: '#7efba4',
  tertiary: '#ffb4a9',
  tertiaryContainer: '#8e130c',
  error: '#f87171',
  errorContainer: '#4c1414',
  onErrorContainer: '#fecaca',
  scrim: 'rgba(0, 0, 0, 0.6)',
  status: {
    healthy: {
      accent: '#34d399',
      background: 'rgba(52, 211, 153, 0.14)',
      border: '#34d399',
      text: '#6ee7b7',
    },
    disease: {
      accent: '#f87171',
      background: 'rgba(248, 113, 113, 0.14)',
      border: '#f87171',
      text: '#fca5a5',
    },
    warning: {
      accent: '#fbbf24',
      background: 'rgba(251, 191, 36, 0.14)',
      border: '#fbbf24',
      text: '#fcd34d',
    },
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, margin: 16 } as const;

export const radius = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 } as const;

/** Outdoor use with gloves: never smaller than 48, primary actions 56. */
export const touch = { min: 48, primary: 56, shutter: 64 } as const;

export type TypeVariant =
  | 'displayLg'
  | 'headlineLg'
  | 'headlineMd'
  | 'headlineSm'
  | 'titleMd'
  | 'bodyLg'
  | 'bodyMd'
  | 'bodyMdMedium'
  | 'labelLg'
  | 'labelMd'
  | 'labelSm';

type Weight = 400 | 500 | 600 | 700;

export const typeScale: Record<
  TypeVariant,
  { size: number; lineHeight: number; weight: Weight; role: 'heading' | 'body'; letterSpacing?: number }
> = {
  displayLg: { size: 32, lineHeight: 40, weight: 700, role: 'heading', letterSpacing: -0.64 },
  headlineLg: { size: 26, lineHeight: 34, weight: 700, role: 'heading', letterSpacing: -0.26 },
  headlineMd: { size: 22, lineHeight: 28, weight: 600, role: 'heading' },
  headlineSm: { size: 20, lineHeight: 26, weight: 600, role: 'heading' },
  titleMd: { size: 18, lineHeight: 24, weight: 600, role: 'heading' },
  bodyLg: { size: 18, lineHeight: 26, weight: 400, role: 'body' },
  bodyMd: { size: 16, lineHeight: 24, weight: 400, role: 'body' },
  bodyMdMedium: { size: 16, lineHeight: 24, weight: 500, role: 'body' },
  labelLg: { size: 16, lineHeight: 22, weight: 600, role: 'body' },
  labelMd: { size: 14, lineHeight: 20, weight: 600, role: 'body', letterSpacing: 0.14 },
  labelSm: { size: 12, lineHeight: 16, weight: 500, role: 'body', letterSpacing: 0.24 },
};

export const shadows = {
  card: {
    shadowColor: '#1a2e20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  raised: {
    shadowColor: '#1a2e20',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  shutter: {
    shadowColor: '#164525',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
} as const;
