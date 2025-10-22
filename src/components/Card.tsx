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
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[padding],
    ...(variant === 'elevated' && theme.shadows.md),
    ...(variant === 'outlined' && {
      borderWidth: 1,
      borderColor: theme.colors.neutral[200],
      ...theme.shadows.none,
    }),
    ...(variant === 'filled' && {
      backgroundColor: theme.colors.neutral[50],
      ...theme.shadows.none,
    }),
  };

  return <View style={[cardStyles, style]}>{children}</View>;
};
