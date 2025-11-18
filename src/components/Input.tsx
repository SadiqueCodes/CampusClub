import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, containerStyle, leftIcon, style, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  // If style includes custom props (like for glass effect), skip default container
  const hasCustomStyle = style && typeof style === 'object' && ('backgroundColor' in style || 'borderWidth' in style);

  if (hasCustomStyle) {
    return (
      <TextInput
        style={[styles.customInput, style]}
        placeholderTextColor="rgba(255,255,255,0.5)"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.text.muted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.glass.dark,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    height: 52,
  },
  inputFocused: {
    borderColor: theme.colors.primary[500],
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  inputError: {
    borderColor: theme.colors.error.main,
  },
  leftIcon: {
    marginRight: theme.spacing.md,
  },
  input: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    padding: 0,
  },
  error: {
    color: theme.colors.error.main,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  customInput: {
    fontSize: theme.fontSize.md,
    padding: 0,
  },
});
