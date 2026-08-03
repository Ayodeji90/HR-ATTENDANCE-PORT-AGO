import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: colors.success[100], fg: colors.success[700] },
  warning: { bg: colors.warning[100], fg: colors.warning[600] },
  danger: { bg: colors.primary[100], fg: colors.primary[700] },
  info: { bg: colors.info[100], fg: colors.info[600] },
  neutral: { bg: colors.ink[100], fg: colors.ink[600] },
};

interface BadgeProps {
  label: string;
  tone?: Tone;
}

export const Badge: React.FC<BadgeProps> = ({ label, tone = 'neutral' }) => {
  const { bg, fg } = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '600' },
});
