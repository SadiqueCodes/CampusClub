import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ children, style, elevation = 'md' }) => {
  return (
    <View style={[styles.card, theme.shadows[elevation], style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
});
