import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius } from '../../theme';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({ title, children, style }) => (
  <View style={[styles.card, style]}>
    {title ? <Text style={styles.title}>{title}</Text> : null}
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.ink[100],
    shadowColor: colors.ink[900],
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink[800],
    marginBottom: 10,
  },
});
