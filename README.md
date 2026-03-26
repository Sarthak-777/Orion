# Orion

A guitar practice companion app built with React Native and Expo. Tuner, metronome, PDF tab library, music player with slow-down, and voice memos.

## Features

- **Tuner** — Real-time pitch detection for guitar, bass, and ukulele with multiple tunings, auto-detect, and haptic feedback
- **Metronome** — Adjustable BPM (40–240) with visual beat indicators, accent on beat 1, and preset tempos
- **PDF Tab Library** — Import, search, rename, and view guitar tabs as PDFs
- **Music Player** — Play audio files with pitch-corrected slow-down (0.25x–1.0x), waveform scrubbing, and A/B looping
- **Voice Memos** — Record practice ideas in a chat-style interface with emoji reactions
- **Cloud Sync** — Optional backup/restore via Supabase (fully offline without it)
- **Dark / Light Mode** — Persisted theme preference

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (comes with Node.js)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — installed automatically via npx
- For iOS: macOS with [Xcode](https://developer.apple.com/xcode/) (15+) and iOS Simulator
- For Android: [Android Studio](https://developer.android.com/studio) with an emulator configured
- For Web: any modern browser

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Sarthak-777/orion-app.git
cd orion-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment setup (optional — for cloud sync)

Cloud sync is **optional**. The app works fully offline without it. To enable:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

See `.env.example` for full Supabase setup instructions (creating buckets, storage policies, etc.).

### 4. Run the app

```bash
# Start the Expo dev server
npm start

# Then press:
#   i — open iOS Simulator
#   a — open Android Emulator
#   w — open in web browser
```

Or run directly on a specific platform:

```bash
npm run ios        # iOS Simulator (macOS only)
npm run android    # Android Emulator
npm run web        # Web browser
```

### 5. Run on a physical device

Install [Expo Go](https://expo.dev/go) on your phone, then scan the QR code shown by `npm start`.

> **Note**: Some features (pitch detection via `react-native-pitchy`) require a development build and won't work in Expo Go. Use `npx expo prebuild` + native build for full functionality.

## Project Structure

```
orion-app/
├── App.js                 # Root component — providers + navigation
├── index.js               # Entry point
├── app.json               # Expo config
├── src/
│   ├── screens/           # Screen components
│   ├── components/        # Reusable UI components
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom hooks (useTuner)
│   ├── services/          # Storage, audio, sync services
│   ├── utils/             # Helpers (pitch, base64, filesystem)
│   ├── config/            # Supabase client config
│   ├── constants/         # Tunings, instruments, frequencies
│   └── navigation/        # Tab + stack navigators
├── specs/
│   └── features/          # Feature specs and bug tickets
├── assets/                # App icons, splash screen
└── CLAUDE.md              # AI assistant project instructions
```

## Development Notes

- **Language**: JavaScript only — no TypeScript
- **Styling**: `StyleSheet.create()` per component, theme-aware via `useTheme()`
- **State management**: React Context + AsyncStorage. No Redux/Zustand.
- **Package manager**: npm (do not use yarn or pnpm)
- **Native config**: All via `app.json` — do not manually edit `/ios` or `/android` (gitignored)

### Generating native directories

If you need native builds (required for `react-native-pitchy`):

```bash
npx expo prebuild
```

This generates `/ios` and `/android` directories. They are gitignored — regenerate as needed.

## Supabase Setup (Cloud Sync)

Full setup if you want cloud sync:

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > API** — copy Project URL and anon key
3. Create 3 **public** storage buckets: `tabs`, `music`, `voice_memos`
4. For each bucket, add a storage policy:
   - Policy name: `Allow all operations`
   - Operations: SELECT, INSERT, UPDATE, DELETE
   - Target roles: `anon`
   - USING expression: `true`
   - WITH CHECK expression: `true`
5. Add credentials to `.env` (see step 3 above)

## Permissions

The app requests the following permissions:

| Permission | Platform | Purpose |
|---|---|---|
| Microphone | iOS, Android | Pitch detection (tuner) and voice memo recording |
| Audio settings | Android | Metronome and playback configuration |

## License

Private — not open source.
