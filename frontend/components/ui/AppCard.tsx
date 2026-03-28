import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { theme } from '../../theme';

type AppCardProps = ViewProps;

export default function AppCard({ style, ...props }: AppCardProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
});
