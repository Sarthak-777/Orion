# ORION-007: Cloud Sync (Supabase)

| Field         | Value                                          |
|---------------|-------------------------------------------------|
| **ID**        | ORION-007                                       |
| **Type**      | Feature                                         |
| **Priority**  | Medium                                          |
| **Status**    | Done                                            |
| **Epic**      | Cloud & Sync                                    |
| **Created**   | 2026-03-26                                      |
| **Author**    | Sarthak                                         |
| **Assignee**  | Sarthak                                         |
| **Labels**    | `sync`, `supabase`, `cloud`, `storage`          |
| **Estimate**  | 8 story points                                  |

---

## Summary

Optional cloud sync via Supabase Storage for tabs, music files, and voice memos. App works fully offline; sync is opt-in and gracefully degrades when Supabase is unconfigured.

## Motivation / Why

Users may use multiple devices or want backup protection. Cloud sync makes data portable without forcing it — the app must remain fully functional offline for users who don't want or need sync.

## User Stories

1. **As a user**, I want to back up my tabs/music/memos to the cloud.
2. **As a user**, I want to restore my data on a new device.
3. **As a user**, I want sync to be optional — the app should work fine without it.
4. **As a user**, I want to see when my last sync happened.

## Detailed Description

### Sync Architecture

- 3 Supabase Storage buckets: `tabs`, `music`, `voice_memos`
- Each file upload stores: raw file + `.json` metadata sidecar
- `genericStorageService.js` provides `SupabaseStorageAdapter` — shared abstraction used by all storage services
- Upload: `base64ToBytes()` → direct byte upload (NOT `.buffer` — causes corruption in RN)
- Download: signed URL → `FileSystem.downloadAsync()` (Blob.arrayBuffer doesn't work in RN)
- Custom `base64.js` decoder (atob/btoa don't exist in React Native)

### Sync Settings

- Enable/disable sync toggle
- Auto-sync on app launch toggle
- Manual sync button
- Restore from cloud button
- Reset sync settings
- Last sync timestamp display

### Offline-First

- All features work without Supabase configured
- If env vars missing, sync UI hidden or disabled
- No errors thrown when Supabase is unavailable
- Data lives locally first, cloud is supplementary

### SyncContext

- Manages sync state: enabled, autoSync, lastSync, syncing
- Coordinates syncing across tabs, music, memos services
- Provides `syncAll()`, `restoreAll()`, `resetSync()` methods
- Persisted to AsyncStorage (`@supabase_sync_settings`)

## Acceptance Criteria

- [x] Upload files to Supabase Storage with metadata JSON sidecar
- [x] Download files via signed URLs + FileSystem.downloadAsync
- [x] Custom base64 decoder for React Native compatibility
- [x] Upload uses `base64ToBytes()` directly, NOT `.buffer`
- [x] 3 separate buckets: tabs, music, voice_memos
- [x] genericStorageService provides shared SupabaseStorageAdapter
- [x] Enable/disable sync toggle in Settings
- [x] Auto-sync on app launch (configurable)
- [x] Manual sync button with last sync timestamp
- [x] Restore from cloud functionality
- [x] Reset sync settings option
- [x] App works fully offline when Supabase unconfigured
- [x] Graceful degradation — no errors when sync unavailable
- [x] CloudStorageIndicator component shows sync status

## Technical Notes

- **Critical**: Never use `.buffer` on base64-decoded bytes — causes data corruption in React Native
- **Critical**: Never use `Blob.arrayBuffer()` for downloads — doesn't work in RN
- Supabase config via env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Files

- `src/services/supabaseStorageService.js`
- `src/services/genericStorageService.js`
- `src/context/SyncContext.js`
- `src/context/AuthContext.js`
- `src/config/supabase.js`
- `src/utils/base64.js`
- `src/utils/filesystem.js`
- `src/components/CloudStorageIndicator.js`

## Subtasks

- [x] **ORION-007a**: Set up Supabase client config
- [x] **ORION-007b**: Implement supabaseStorageService (upload/download/list/delete)
- [x] **ORION-007c**: Build genericStorageService with SupabaseStorageAdapter
- [x] **ORION-007d**: Implement custom base64 decoder for RN
- [x] **ORION-007e**: Create SyncContext with sync/restore/reset methods
- [x] **ORION-007f**: Add sync settings UI to Settings screen
- [x] **ORION-007g**: Integrate sync into tabs, music, and memo services
- [x] **ORION-007h**: Ensure full offline functionality without Supabase
