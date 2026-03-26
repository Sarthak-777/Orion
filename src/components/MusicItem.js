import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDuration } from '../utils/formatters';

// Simple waveform visualization component
function WaveformVisualizer({ theme }) {
  const [bars] = useState(() =>
    Array.from({ length: 24 }, () => 0.2 + Math.random() * 0.8)
  );

  return (
    <View style={styles.waveformContainer}>
      {bars.map((height, index) => (
        <View
          key={index}
          style={[
            styles.waveformBar,
            {
              height: height * 28,
              backgroundColor: theme.colors.textMuted,
              opacity: 0.6,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function MusicItem({ item, theme, onPress, onLongPress }) {
  const localStyles = createLocalStyles(theme);

  return (
    <TouchableOpacity
      style={localStyles.container}
      onPress={() => onPress?.(item)}
      onLongPress={() => onLongPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={localStyles.infoContainer}>
        <Text style={localStyles.title} numberOfLines={1}>{item.name}</Text>
        <Text style={localStyles.duration}>
          {formatDuration(item.duration)}
        </Text>
      </View>

      <WaveformVisualizer theme={theme} />

      <View style={localStyles.arrowContainer}>
        <Text style={localStyles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    gap: 2,
    flex: 1,
    marginHorizontal: 12,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
});

const createLocalStyles = (theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoContainer: {
    width: 80,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  duration: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 24,
    color: theme.colors.textMuted,
    fontWeight: '300',
  },
});

export default MusicItem;
