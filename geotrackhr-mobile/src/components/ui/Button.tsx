import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius } from '../../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BACKGROUNDS: Record<Variant, string> = {
  primary: colors.primary[600],
  secondary: colors.ink[100],
  outline: 'transparent',
  danger: colors.primary[500],
};

const TEXT_COLORS: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.ink[800],
  outline: colors.primary[600],
  danger: colors.white,
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) => {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'outline' && styles.outline,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary[600] : TEXT_COLORS[variant]} />
      ) : (
        <Text style={[styles.label, { color: TEXT_COLORS[variant] }]}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: colors.primary[600],
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.primary[500],
    backgroundColor: 'transparent',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
  label: { fontSize: 15, fontWeight: '600' },
});
