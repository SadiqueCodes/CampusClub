export const colors = {
  // Primary brand colors - Modern and sophisticated
  primary: {
    50: '#F0F4FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Main brand color
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // Secondary accent colors
  secondary: {
    50: '#FDF4FF',
    100: '#FAE8FF',
    200: '#F5D0FE',
    300: '#F0ABFC',
    400: '#E879F9',
    500: '#D946EF',
    600: '#C026D3',
    700: '#A21CAF',
    800: '#86198F',
    900: '#701A75',
  },

  // Neutral colors for text and backgrounds
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic colors
  success: {
    light: '#D1FAE5',
    main: '#10B981',
    dark: '#065F46',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#991B1B',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#92400E',
  },
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#1E40AF',
  },

  // Gradient combinations for different screens
  gradients: {
    home: ['#6366F1', '#8B5CF6'],
    create: ['#F59E0B', '#F97316'],
    chat: ['#3B82F6', '#60A5FA'],
    profile: ['#8B5CF6', '#A855F7'],
    auth: ['#6366F1', '#7C3AED'],
  },

  // Glass morphism effects
  glass: {
    white: 'rgba(255, 255, 255, 0.1)',
    dark: 'rgba(0, 0, 0, 0.1)',
    border: 'rgba(255, 255, 255, 0.18)',
  },

  // UI colors
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.4)',
  shadow: 'rgba(0, 0, 0, 0.1)',

  // Backward compatibility - old color structure
  blue: {
    babyBlue: '#DBEAFE',
    indigo: '#4F46E5',
    royal: '#3730A3',
  },
  green: {
    forest: '#065F46',
    neonLime: '#10B981',
  },
  yellow: {
    chartreuse: '#F59E0B',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#E5E5E5',
    dark: '#171717',
    darkGrey: '#737373',
  },
  background: {
    home: '#FAFAFA',
    create: '#FAFAFA',
    chat: '#FAFAFA',
    profile: '#FAFAFA',
  },
  accent: {
    home: '#6366F1',
    create: '#F59E0B',
    chat: '#3B82F6',
    profile: '#8B5CF6',
  },
  border: '#E5E5E5',
  card: '#FFFFFF',
};

export type ColorTheme = typeof colors;
