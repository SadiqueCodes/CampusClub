import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  fullWidth = false,
}) => {
  const sizeStyles = {
    small: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      height: 40,
    },
    medium: {
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xxl,
      height: 48,
    },
    large: {
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.xxxl,
      height: 56,
    },
  };

  const textSizes = {
    small: theme.fontSize.sm,
    medium: theme.fontSize.md,
    large: theme.fontSize.lg,
  };

  const baseContainerStyle: ViewStyle = {
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.6 : 1,
    ...sizeStyles[size],
    ...(fullWidth && { width: '100%' }),
    ...theme.shadows.md,
  };

  const textStyle: TextStyle = {
    fontSize: textSizes[size],
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 0.3,
  };

  if (variant === 'primary' && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={style}
      >
        <LinearGradient
          colors={[theme.colors.primary[600], theme.colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={baseContainerStyle}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={[textStyle, { color: theme.colors.white }]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: theme.colors.primary[600],
    },
    secondary: {
      backgroundColor: theme.colors.neutral[100],
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.colors.primary[600],
      ...theme.shadows.none,
    },
    ghost: {
      backgroundColor: 'transparent',
      ...theme.shadows.none,
    },
  };

  const textColors: Record<string, string> = {
    primary: theme.colors.white,
    secondary: theme.colors.neutral[900],
    outline: theme.colors.primary[600],
    ghost: theme.colors.primary[600],
  };

  return (
    <TouchableOpacity
      style={[baseContainerStyle, variantStyles[variant], style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <Text style={[textStyle, { color: textColors[variant] }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
