import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { theme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  backgroundColor,
  textColor,
  style,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.5 : 1,
    };

    const sizeStyles = {
      small: { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md },
      medium: { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg },
      large: { paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing.xl },
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: backgroundColor || theme.colors.blue.indigo,
      },
      secondary: {
        backgroundColor: backgroundColor || theme.colors.green.neonLime,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: backgroundColor || theme.colors.white,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles = {
      small: { fontSize: theme.fontSize.sm },
      medium: { fontSize: theme.fontSize.md },
      large: { fontSize: theme.fontSize.lg },
    };

    const variantStyles: Record<string, TextStyle> = {
      primary: { color: textColor || theme.colors.white },
      secondary: { color: textColor || theme.colors.text.dark },
      outline: { color: textColor || theme.colors.white },
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant],
      fontWeight: theme.fontWeight.bold,
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? theme.colors.text.dark : theme.colors.white} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
