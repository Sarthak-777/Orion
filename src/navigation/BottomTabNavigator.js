import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TunerScreen, TabsScreen, SettingsScreen, PdfViewerScreen, VoiceMemosScreen, MusicPlayerScreen } from '../screens';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TabsList" component={TabsScreen} />
      <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
      <Stack.Screen name="MusicPlayer" component={MusicPlayerScreen} />
    </Stack.Navigator>
  );
}

export function BottomTabNavigator() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          let label = '';
          switch (route.name) {
            case 'Practice':
              label = 'P';
              break;
            case 'Library':
              label = 'L';
              break;
            case 'Memos':
              label = 'M';
              break;
            case 'Settings':
              label = 'S';
              break;
          }
          return (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Text style={[styles.iconText, focused && styles.iconTextActive]}>
                {label}
              </Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Practice"
        component={TunerScreen}
        options={{ tabBarLabel: 'Practice' }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryStack}
        options={{ tabBarLabel: 'Library' }}
      />
      <Tab.Screen
        name="Memos"
        component={VoiceMemosScreen}
        options={{ tabBarLabel: 'Memos' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

const createStyles = (theme) => StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    height: 65,
    paddingTop: 6,
    paddingBottom: 10,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconContainerActive: {
    backgroundColor: theme.colors.text,
  },
  iconText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  iconTextActive: {
    color: theme.colors.background,
  },
});
