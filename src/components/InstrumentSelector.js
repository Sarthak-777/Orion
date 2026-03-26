import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function InstrumentSelector({ instruments = [], selectedId, onSelect, theme }) {
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {instruments.map((instrument) => {
          const isSelected = selectedId === instrument.id;

          return (
            <TouchableOpacity
              key={instrument.id}
              style={[
                styles.button,
                isSelected && styles.selectedButton,
              ]}
              onPress={() => onSelect?.(instrument.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.name, isSelected && styles.selectedText]}>
                {instrument.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
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
    fontSize: 14,
    fontWeight: '500',
  },
  selectedText: {
    color: theme.colors.background,
  },
});
