import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { theme } from '../../theme';

interface AppInputProps extends TextInputProps {
  icon?: React.ReactNode;
}

export default function AppInput({ icon, style, ...props }: AppInputProps) {
  return (
    <View style={styles.container}>
      {icon}
      <TextInput
        {...props}
        placeholderTextColor="#94A3B8"
        style={[styles.input, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 54,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  input: {
    flex: 1,
    fontSize: theme.text.md,
    color: theme.colors.text,
  },
});
