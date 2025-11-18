import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof theme.spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
  padding = 'lg',
}) => {
  const cardStyles: ViewStyle = {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[padding],
    ...(variant === 'elevated' && {
      backgroundColor: theme.colors.card,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    }),
    ...(variant === 'outlined' && {
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.none,
    }),
    ...(variant === 'filled' && {
      backgroundColor: theme.colors.glass.dark,
      ...theme.shadows.none,
    }),
  };

  return <View style={[cardStyles, style]}>{children}</View>;
};
