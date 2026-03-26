import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import { SyncProvider } from './src/context/SyncContext';
import { AuthProvider } from './src/context/AuthContext';
import { UserProfileProvider } from './src/context/UserProfileContext';
import { TunerSettingsProvider } from './src/context/TunerSettingsContext';
import { BottomTabNavigator } from './src/navigation/BottomTabNavigator';

function AppContent() {
  const { theme, isDarkMode } = useTheme();

  const navigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.text,
    },
  };

  return (
    <ToastProvider>
      <UserProfileProvider>
        <TunerSettingsProvider>
          <AuthProvider>
            <SyncProvider>
              <NavigationContainer theme={navigationTheme}>
                <BottomTabNavigator />
              </NavigationContainer>
            </SyncProvider>
          </AuthProvider>
        </TunerSettingsProvider>
      </UserProfileProvider>
    </ToastProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
