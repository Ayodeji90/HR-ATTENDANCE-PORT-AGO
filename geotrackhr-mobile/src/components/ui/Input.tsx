import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, style, ...rest }) => (
  <View style={styles.wrapper}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <TextInput
      placeholderTextColor={colors.ink[300]}
      style={[styles.input, error ? styles.inputError : null, style]}
      {...rest}
    />
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink[600],
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.ink[200],
    borderRadius: radius.md,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.ink[900],
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.primary[500] },
  error: { marginTop: 4, fontSize: 12, color: colors.primary[600] },
});
