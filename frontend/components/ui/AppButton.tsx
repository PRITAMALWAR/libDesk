import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary';
}

export default function AppButton({ title, onPress, style, variant = 'primary' }: AppButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, isPrimary ? styles.primary : styles.secondary, style]}
      activeOpacity={0.88}
    >
      <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textSecondary]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: '#EEF2FF',
  },
  text: {
    fontSize: theme.text.md,
    fontWeight: '700',
  },
  textPrimary: {
    color: '#fff',
  },
  textSecondary: {
    color: theme.colors.primary,
  },
});
