import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export function TuningSelector({ tunings = [], selectedId, onSelect, theme }) {
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tunings.map((tuning) => {
          const isSelected = selectedId === tuning.id;

          return (
            <TouchableOpacity
              key={tuning.id}
              style={[
                styles.button,
                isSelected && styles.selectedButton,
              ]}
              onPress={() => onSelect?.(tuning.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.name, isSelected && styles.selectedText]}>
                {tuning.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedButton: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  name: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  selectedText: {
    color: theme.colors.background,
  },
});
