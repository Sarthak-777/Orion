import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const METER_WIDTH = 260;
const INDICATOR_WIDTH = 3;
const MAX_CENTS = 50;

export function TunerMeter({ cents = 0, tuningStatus = 'flat', isActive = false, theme }) {
  const clampedCents = Math.max(-MAX_CENTS, Math.min(MAX_CENTS, cents));
  const position = clampedCents / MAX_CENTS;
  const indicatorOffset = (position * (METER_WIDTH / 2 - INDICATOR_WIDTH / 2));

  const getIndicatorColor = () => {
    if (!isActive) return theme.colors.textMuted;
    switch (tuningStatus) {
      case 'in_tune':
        return theme.colors.tunerGreen;
      case 'flat':
      case 'sharp':
        return theme.colors.tunerOrange;
      default:
        return theme.colors.textMuted;
    }
  };

  const indicatorColor = getIndicatorColor();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Meter bar */}
      <View style={styles.meterBar}>
        {/* Center zone indicator */}
        <View style={styles.centerZone} />

        {/* Tick marks */}
        <View style={[styles.tickMark, { left: '0%' }]} />
        <View style={[styles.tickMark, { left: '25%' }]} />
        <View style={[styles.tickMark, styles.centerTick, { left: '50%' }]} />
        <View style={[styles.tickMark, { left: '75%' }]} />
        <View style={[styles.tickMark, { left: '100%' }]} />

        {/* Indicator needle */}
        <View
          style={[
            styles.indicator,
            {
              backgroundColor: indicatorColor,
              transform: [{ translateX: indicatorOffset }],
            },
          ]}
        />
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        {isActive ? (
          <Text style={[styles.statusText, { color: indicatorColor }]}>
            {tuningStatus === 'in_tune' ? 'In tune' : tuningStatus === 'flat' ? 'Flat' : 'Sharp'}
          </Text>
        ) : (
          <Text style={styles.statusText}>Ready</Text>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  meterBar: {
    width: METER_WIDTH,
    height: 32,
    backgroundColor: theme.colors.surface,
    borderRadius: 6,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  centerZone: {
    position: 'absolute',
    left: '45%',
    width: '10%',
    height: '100%',
    backgroundColor: theme.mode === 'dark'
      ? 'rgba(34, 197, 94, 0.15)'
      : 'rgba(22, 163, 74, 0.1)',
  },
  tickMark: {
    position: 'absolute',
    width: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    top: 0,
    marginLeft: -0.5,
  },
  centerTick: {
    height: 12,
    backgroundColor: theme.colors.tunerGreen,
    width: 2,
    marginLeft: -1,
  },
  indicator: {
    position: 'absolute',
    width: INDICATOR_WIDTH,
    height: '100%',
    left: '50%',
    marginLeft: -INDICATOR_WIDTH / 2,
    borderRadius: 1,
  },
  statusContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  statusText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
