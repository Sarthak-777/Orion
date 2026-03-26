# Getting Started

## Prerequisites

- Node.js (LTS recommended)
- npm (comes with Node)
- Expo CLI: `npm install -g expo-cli` (or use `npx expo`)
- For iOS: macOS + Xcode + iOS Simulator
- For Android: Android Studio + emulator or physical device
- For Web: any modern browser

## Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd orion-app
npm install
```

### 2. Environment Variables (Optional)

Cloud sync requires Supabase. Copy the example and fill in your values:

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The app works fully offline without these. Sync features will be hidden if unconfigured.

### 3. Supabase Setup (Optional)

If using cloud sync, create three storage buckets in your Supabase dashboard:
- `tabs`
- `music`
- `voice_memos`

Set bucket policies to allow authenticated/anon access as needed.

## Running the App

```bash
# Start Expo dev server (press i for iOS, a for Android, w for Web)
npm start

# Direct platform launch
npm run ios       # iOS simulator
npm run android   # Android emulator
npm run web       # Web browser
```

## Project Structure

```
orion-app/
├── App.js              # Root component + provider stack
├── index.js            # Entry point
├── app.json            # Expo configuration
├── package.json        # Dependencies
├── src/                # All source code
│   ├── screens/        # Screen components
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context providers
│   ├── hooks/          # Custom hooks
│   ├── services/       # Data/IO layer
│   ├── utils/          # Pure helpers
│   ├── config/         # External service config
│   ├── constants/      # Static data
│   └── navigation/     # Navigator definitions
├── assets/             # Icons, splash, sounds
├── scripts/            # Build/utility scripts
└── spec/docs/          # Documentation (you are here)
```

## Key Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run web` | Run in browser |
| `npx expo install <pkg>` | Install Expo-compatible package |
| `npx expo prebuild` | Generate native directories (gitignored) |

## Development Notes

### No TypeScript
The project uses plain JavaScript. Do not add `.ts`/`.tsx` files.

### No Test Framework
No testing framework is currently configured. Tests are a future addition.

### No Linter/Formatter
No ESLint or Prettier configured. Follow existing code style.

### Managed Expo Workflow
All native config is in `app.json`. Do not manually edit `ios/` or `android/` directories (they're gitignored and regenerated via `npx expo prebuild`).

### New Architecture
Expo New Architecture is enabled in `app.json`. This uses the new React Native rendering engine (Fabric) and TurboModules.

## Adding a New Screen

1. Create `src/screens/NewScreen.js`
2. Export from `src/screens/index.js`
3. Add route in `src/navigation/BottomTabNavigator.js`
4. If it needs shared state, create a context in `src/context/`

## Adding a New Service

1. Create `src/services/newService.js`
2. Define AsyncStorage key if persisting data
3. Export CRUD methods
4. If cloud sync needed, create a `SupabaseStorageAdapter` instance

## Common Patterns

### Reading Theme Colors
```js
import { useTheme } from '../context/ThemeContext';

const MyComponent = () => {
  const { theme, isDarkMode } = useTheme();
  return <View style={{ backgroundColor: theme.background }} />;
};
```

### Showing a Toast
```js
import { useToast } from '../context/ToastContext';

const { showToast } = useToast();
showToast('File saved', 'success');
```

### File Operations
```js
import * as FileSystem from 'expo-file-system';

const dir = FileSystem.documentDirectory + 'myfiles/';
await ensureDirectory(dir);
await FileSystem.copyAsync({ from: sourceUri, to: dir + filename });
```
