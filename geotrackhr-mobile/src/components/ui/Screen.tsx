import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';

interface ScreenProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}

/**
 * Standard page shell: safe-area padding, optional title header, and a
 * scrollable content column (with optional pull-to-refresh).
 */
export const Screen: React.FC<ScreenProps> = ({ title, subtitle, children, refreshing, onRefresh }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          refreshing !== undefined ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[600]} />
          ) : undefined
        }
      >
        {title ? (
          <View style={styles.header}>
            <Text style={typography.title}>{title}</Text>
            {subtitle ? <Text style={[typography.small, styles.subtitle]}>{subtitle}</Text> : null}
          </View>
        ) : null}
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink[50] },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.lg },
  subtitle: { marginTop: 4 },
});
