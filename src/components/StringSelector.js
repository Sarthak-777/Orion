import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function StringSelector({
  notes = [],
  selectedString = null,
  onSelectString,
  activeString = null,
  isListening = false,
  theme,
}) {
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.stringsRow}>
        {notes.map((note, index) => {
          const isSelected = selectedString === index;
          const isActive = isListening && activeString === index;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.stringButton,
                isSelected && styles.selectedButton,
                isActive && styles.activeButton,
              ]}
              onPress={() => onSelectString?.(index)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.stringNote,
                isSelected && styles.selectedText,
                isActive && styles.activeText,
              ]}>
                {note}
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
    marginVertical: 8,
  },
  stringsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  stringButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    minWidth: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedButton: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  activeButton: {
    backgroundColor: theme.colors.tunerGreen,
    borderColor: theme.colors.tunerGreen,
  },
  stringNote: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  selectedText: {
    color: theme.colors.background,
  },
  activeText: {
    color: theme.mode === 'dark' ? '#000' : '#fff',
  },
});
