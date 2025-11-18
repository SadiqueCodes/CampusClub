type Gradient = readonly [string, string, string];

export const colors = {
  // Primary brand colors - Neo noir palette
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#5B63FF',
    600: '#3F3DE3',
    700: '#2B2AC7',
    800: '#1F1F97',
    900: '#12135C',
  },

  secondary: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },

  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5F5',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0B1220',
  },

  success: {
    light: '#16F2A8',
    main: '#0CE39A',
    dark: '#057C5B',
  },
  error: {
    light: '#FF8DA1',
    main: '#FF5C7C',
    dark: '#C73A4F',
  },
  warning: {
    light: '#FFE4A2',
    main: '#FFC857',
    dark: '#B08902',
  },
  info: {
    light: '#7DD3FC',
    main: '#38BDF8',
    dark: '#0EA5E9',
  },

  gradients: {
    home: ['#0B1220', '#111B32', '#182449'] as Gradient,
    create: ['#101828', '#1F1F45', '#2C2C61'] as Gradient,
    chat: ['#0F172A', '#17213E', '#1F2A52'] as Gradient,
    profile: ['#0B1220', '#151B34', '#1E2448'] as Gradient,
    auth: ['#070B16', '#171E2E', '#262F47'] as Gradient,
  },

  glass: {
    white: 'rgba(255, 255, 255, 0.08)',
    dark: 'rgba(7, 11, 22, 0.8)',
    border: 'rgba(255, 255, 255, 0.18)',
  },

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(2, 6, 23, 0.8)',
  shadow: 'rgba(2, 6, 23, 0.6)',

  glow: {
    cyan: '0 0 25px rgba(56,189,248,0.55)',
    purple: '0 0 25px rgba(91,99,255,0.55)',
  },

  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5F5',
    muted: '#94A3B8',
    onPrimary: '#0B1220',
  },
  background: {
    home: '#0B1220',
    create: '#0B1220',
    chat: '#0B1220',
    profile: '#0B1220',
    auth: '#070B16',
  },
  accent: {
    primary: '#5B63FF',
    neon: '#38BDF8',
    magenta: '#FF4D94',
  },
  border: '#1F2937',
  card: '#121A2C',
};

export type ColorTheme = typeof colors;
