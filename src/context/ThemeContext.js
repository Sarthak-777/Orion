import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@app_theme';

// Matte black dark theme - minimalistic
const darkTheme = {
  mode: 'dark',
  colors: {
    background: '#0a0a0a',
    surface: '#141414',
    surfaceLight: '#1a1a1a',
    border: '#252525',
    primary: '#ffffff',
    primaryMuted: '#a0a0a0',
    accent: '#3d3d3d',
    accentActive: '#4a4a4a',
    text: '#ffffff',
    textSecondary: '#808080',
    textMuted: '#505050',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#f87171',
    tunerGreen: '#22c55e',
    tunerOrange: '#f97316',
  },
};

// Light theme - clean and minimal
const lightTheme = {
  mode: 'light',
  colors: {
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceLight: '#fafafa',
    border: '#e5e5e5',
    primary: '#0a0a0a',
    primaryMuted: '#525252',
    accent: '#e5e5e5',
    accentActive: '#d4d4d4',
    text: '#0a0a0a',
    textSecondary: '#525252',
    textMuted: '#a3a3a3',
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    tunerGreen: '#16a34a',
    tunerOrange: '#ea580c',
  },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem(THEME_KEY, newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
