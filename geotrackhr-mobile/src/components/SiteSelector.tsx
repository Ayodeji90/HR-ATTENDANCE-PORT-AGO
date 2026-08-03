import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { Site } from '../types';
import { colors, radius } from '../theme';

interface SiteSelectorProps {
  sites: Site[];
  selectedId: string | null;
  onSelect: (site: Site) => void;
}

/**
 * Horizontal scrollable site chips for choosing where a punch applies.
 */
export const SiteSelector: React.FC<SiteSelectorProps> = ({ sites, selectedId, onSelect }) => {
  if (sites.length === 0) {
    return <Text style={styles.empty}>No sites available. Check your connection and try again.</Text>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {sites.map((site) => {
        const selected = site.id === selectedId;
        return (
          <Pressable
            key={site.id}
            onPress={() => onSelect(site)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{site.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink[200],
  },
  chipSelected: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  label: { fontSize: 13, fontWeight: '500', color: colors.ink[700] },
  labelSelected: { color: colors.white },
  empty: { fontSize: 13, color: colors.ink[500] },
});
