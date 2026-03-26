# ORION-011: Migrate Codebase to TypeScript

| Field         | Value                                    |
|---------------|------------------------------------------|
| **ID**        | ORION-011                                |
| **Type**      | Improvement                              |
| **Priority**  | Medium                                   |
| **Status**    | Backlog                                  |
| **Epic**      | Developer Experience                     |
| **Created**   | 2026-03-26                               |
| **Author**    | Sarthak                                  |
| **Assignee**  | Unassigned                               |
| **Labels**    | `typescript`, `dx`, `refactor`           |
| **Estimate**  | 13 story points                          |

---

## Summary

Migrate the entire Orion codebase from JavaScript to TypeScript for type safety, better IDE support, and reduced runtime bugs.

## Motivation / Why

- No type safety — bugs from wrong prop types, mismatched function signatures, and undefined access only surface at runtime.
- IDE autocomplete and refactoring support are limited without types.
- As the codebase grows (practice sessions, more sync logic), untyped code becomes increasingly risky.
- TypeScript is the industry standard for React Native/Expo projects and Expo SDK 54 has first-class TS support.

## User Stories

1. **As a developer**, I want type errors caught at build time so bugs don't reach users.
2. **As a developer**, I want accurate autocomplete and go-to-definition for faster development.
3. **As a developer**, I want typed interfaces for storage, services, and navigation so contracts are explicit.

## Detailed Description

### Phase 1: Setup & Infrastructure

- Add `tsconfig.json` with strict mode enabled (Expo's default TS template as base).
- Rename `App.js` → `App.tsx`, `index.js` → `index.ts`.
- Verify the app still builds and runs after minimal rename.
- Add type declaration files for untyped third-party deps if needed (`@types/*` or custom `*.d.ts`).

### Phase 2: Core Types & Interfaces

Define shared types in `src/types/` before migrating files:

```ts
// src/types/index.ts
export interface Theme { ... }
export interface TunerSettings { instrument: string; referenceFrequency: number; hapticEnabled: boolean; autoDetect: boolean; }
export interface VoiceMemo { id: string; uri: string; name: string; duration: number; date: string; reaction?: string; }
export interface MusicFile { id: string; uri: string; name: string; duration: number; ... }
export interface TabFile { id: string; uri: string; name: string; pageCount?: number; ... }
export interface SyncSettings { enabled: boolean; autoSync: boolean; lastSync?: string; }
export interface UserProfile { displayName: string; }

// Navigation types
export type RootTabParamList = { Practice: undefined; Library: undefined; Memos: undefined; Settings: undefined; }
export type LibraryStackParamList = { TabsList: undefined; PdfViewer: { tab: TabFile }; MusicPlayer: { music: MusicFile }; }
```

### Phase 3: Incremental File Migration (Bottom-Up)

Migrate in dependency order — leaves first, screens last:

1. **Constants & Utils** (no deps): `tunings.ts`, `pitchUtils.ts`, `base64.ts`, `filesystem.ts`, `formatters.ts`
2. **Services** (depend on utils): `audioService.ts`, `audioPlaybackService.ts`, `pitchDetection.ts`, `tabsStorage.ts`, `musicStorageService.ts`, `voiceMemoStorageService.ts`, `supabaseStorageService.ts`, `genericStorageService.ts`
3. **Hooks**: `useTuner.ts`
4. **Contexts**: `ThemeContext.tsx`, `ToastContext.tsx`, `AuthContext.tsx`, `SyncContext.tsx`, `UserProfileContext.tsx`, `TunerSettingsContext.tsx`
5. **Components**: all `.tsx` — `Toast`, `TunerMeter`, `StringSelector`, `InstrumentSelector`, `TuningSelector`, `MusicItem`, `AlertModal`, `CloudStorageIndicator`
6. **Screens**: all `.tsx` — `TunerScreen`, `TabsScreen`, `PdfViewerScreen`, `MusicPlayerScreen`, `VoiceMemosScreen`, `SettingsScreen`
7. **Navigation**: `BottomTabNavigator.tsx` (typed with `@react-navigation/native` types)
8. **Root**: `App.tsx`, `index.ts`

### Migration Rules Per File

- Rename `.js` → `.ts` (non-JSX) or `.js` → `.tsx` (JSX).
- Add explicit types for: function params, return types, state, props, context values.
- Replace `any` with proper types. If unavoidable, add `// TODO: type this` comment.
- No behavioral changes — this is a pure type overlay. If a bug is discovered during migration, file a separate ticket.
- Delete all `PropTypes` imports and usages (replaced by TS).
- Keep `StyleSheet.create()` pattern — use `StyleSheet` typing from React Native.

### tsconfig.json (Proposed)

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

### Dependencies Required

| Package | Purpose |
|---------|---------|
| `typescript` | Compiler (Expo bundles with Metro, but CLI needed for type-checking) |
| `@types/react` | React type defs |
| `@types/react-native` | RN type defs (if not bundled with RN 0.81) |
| `@react-navigation/native` types | Already included if `@react-navigation` is installed |

> **Note**: Expo SDK 54 may already include some of these. Run `npx expo install typescript @types/react` to get Expo-compatible versions.

## Acceptance Criteria

- [ ] `tsconfig.json` exists with strict mode enabled
- [ ] All 40 `.js` files renamed to `.ts` / `.tsx`
- [ ] Zero `any` types without justifying comment
- [ ] Shared interfaces defined in `src/types/index.ts`
- [ ] Navigation fully typed (params, screen props)
- [ ] Context values fully typed (no implicit `any` from `createContext`)
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] App builds and runs on iOS, Android, and Web with no regressions
- [ ] All existing functionality works identically — no behavioral changes
- [ ] `CLAUDE.md` updated: "JavaScript only" → "TypeScript (strict mode)"
- [ ] PropTypes removed from all files (if any exist)

## Technical Notes

- Expo/Metro handles `.ts`/`.tsx` natively — no Babel plugin changes needed.
- Migration can be done incrementally since Metro resolves both `.js` and `.ts`. Files can coexist during migration.
- `allowJs: true` in tsconfig during migration, remove after completion.
- Run `npx tsc --noEmit` as CI check after migration is complete.
- Consider adding a `typecheck` script to `package.json`: `"typecheck": "tsc --noEmit"`.

## Out of Scope

- Adding a test framework (separate ticket).
- Adding ESLint/Prettier with TS rules (separate ticket).
- Refactoring logic or architecture — migration is type overlay only.
- Path alias (`@/`) setup in Metro config — nice-to-have, not required.

## Dependencies

- None — TypeScript is a dev dependency only. No runtime impact.

## Risks / Open Questions

- **react-native-pitchy types**: May not ship types. If not, we need a `pitchy.d.ts` declaration file.
- **Supabase SDK types**: `@supabase/supabase-js` ships types — verify they work with our usage patterns (especially `base64ToBytes` upload).
- **Migration duration**: 40 files is non-trivial. Should we enforce incremental PRs per phase, or one big migration PR?
- **`expo-av` types**: Verify `Sound.setRateAsync` and recording types are accurate.

---

## Subtasks

- [ ] **ORION-011a**: Add `tsconfig.json`, install `typescript` + `@types/*`, verify app still builds
- [ ] **ORION-011b**: Create `src/types/index.ts` with all shared interfaces
- [ ] **ORION-011c**: Migrate constants & utils (Phase 3.1)
- [ ] **ORION-011d**: Migrate services (Phase 3.2)
- [ ] **ORION-011e**: Migrate hooks (Phase 3.3)
- [ ] **ORION-011f**: Migrate contexts (Phase 3.4)
- [ ] **ORION-011g**: Migrate components (Phase 3.5)
- [ ] **ORION-011h**: Migrate screens (Phase 3.6)
- [ ] **ORION-011i**: Migrate navigation with full type safety (Phase 3.7)
- [ ] **ORION-011j**: Migrate root files, remove `allowJs`, final `tsc --noEmit` pass
- [ ] **ORION-011k**: Update `CLAUDE.md` and `package.json` scripts
