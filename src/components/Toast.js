import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';

export function Toast({ visible, message, type = 'error', onDismiss, duration = 3000, theme }) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  if (!visible) return null;

  const styles = createStyles(theme, type);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity style={styles.content} onPress={hideToast} activeOpacity={0.9}>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.dismiss}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (theme, type) => {
  // Black background for dark mode, white background for light mode
  const isDarkMode = theme.colors.background === '#000000' || theme.colors.background === '#0a0a0a';

  return StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 100,
      left: 20,
      right: 20,
      zIndex: 9999,
    },
    content: {
      backgroundColor: isDarkMode ? '#ffffff' : '#000000',
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
    message: {
      flex: 1,
      fontSize: 14,
      color: isDarkMode ? '#000000' : '#ffffff',
      fontWeight: '500',
    },
    dismiss: {
      fontSize: 20,
      color: isDarkMode ? '#666666' : '#999999',
      marginLeft: 8,
      fontWeight: '300',
    },
  });
};
