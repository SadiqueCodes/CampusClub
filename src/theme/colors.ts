export const colors = {
  // Primary color families
  green: {
    forest: '#1B4D3E',
    forestLight: '#2D5F4F',
    neonLime: '#BFFF00',
    lime: '#CCFF33',
  },
  blue: {
    babyBlue: '#A8D8EA',
    babyBlueLight: '#B8E6F5',
    indigo: '#1E3A8A',
    royal: '#2E4B9E',
  },
  yellow: {
    chartreuse: '#F7DC6F',
    bright: '#F4D03F',
  },

  // Functional colors
  text: {
    primary: '#FFFFFF',
    secondary: '#E0E0E0',
    dark: '#1A1A1A',
    darkGrey: '#333333',
  },

  background: {
    home: '#1B4D3E',
    create: '#F7DC6F',
    chat: '#A8D8EA',
    profile: '#1E3A8A',
    auth: '#BFFF00',
  },

  accent: {
    home: '#BFFF00',
    create: '#1E3A8A',
    chat: '#FFFFFF',
    profile: '#BFFF00',
  },

  // UI colors
  white: '#FFFFFF',
  black: '#000000',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FFCC00',

  // Card & component colors
  card: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  border: '#E0E0E0',
};

export type ColorTheme = typeof colors;
