# ORION-004: PDF Tab Library

| Field         | Value                                     |
|---------------|-------------------------------------------|
| **ID**        | ORION-004                                 |
| **Type**      | Feature                                   |
| **Priority**  | High                                      |
| **Status**    | Done                                      |
| **Epic**      | Library                                   |
| **Created**   | 2026-03-26                                |
| **Author**    | Sarthak                                   |
| **Assignee**  | Sarthak                                   |
| **Labels**    | `library`, `tabs`, `pdf`, `storage`, `mvp`|
| **Estimate**  | 5 story points                            |

---

## Summary

Import, store, search, and view PDF guitar tabs with local file storage, metadata management, and optional cloud sync.

## Motivation / Why

Guitar players accumulate tabs as PDFs from various sources. Having them organized in one place — searchable, renamable, and synced — eliminates the need for a separate file manager or tab app.

## User Stories

1. **As a guitarist**, I want to import PDF tabs from my device so they're all in one app.
2. **As a player**, I want to search my tabs by name or instrument so I can find songs quickly.
3. **As a player**, I want to view tabs full-screen with page navigation.
4. **As a player**, I want to rename and delete tabs to keep my library organized.

## Detailed Description

### Tab Management

- Add PDFs via device file picker (DocumentPicker)
- Files copied to `DocumentDirectory/tabs/` for persistence
- Metadata stored in AsyncStorage (`@saved_tabs`): name, instrument, URI, addedDate
- Search by name or instrument
- Rename tabs inline
- Delete with confirmation

### PDF Viewer

- Full-screen PDF rendering via `react-native-pdf`
- Page number display
- Page navigation
- Back button to return to library

### Storage

- Local: files in `DocumentDirectory/tabs/`, metadata in AsyncStorage
- Cloud: optional Supabase sync via `genericStorageService.js`
- Each upload stores file + `.json` metadata sidecar

## Acceptance Criteria

- [x] Add PDF files from device storage via file picker
- [x] PDFs copied to local app directory for persistence
- [x] Metadata (name, instrument, URI, date) stored in AsyncStorage
- [x] Search/filter tabs by name or instrument
- [x] Rename tabs
- [x] Delete tabs with confirmation modal
- [x] Full-screen PDF viewer with page navigation
- [x] Page counter display in viewer
- [x] Cloud sync support (optional, via Supabase)
- [x] Cloud storage indicator shown when sync enabled

## Technical Notes

- `tabsStorage.js` handles CRUD for tab metadata + file operations
- PDF viewer is a separate screen in nested stack navigator (`LibraryStack`)
- Uses `genericStorageService.js` (`SupabaseStorageAdapter`) for cloud sync

## Files

- `src/screens/TabsScreen.js`
- `src/screens/PdfViewerScreen.js`
- `src/services/tabsStorage.js`
- `src/components/CloudStorageIndicator.js`

## Subtasks

- [x] **ORION-004a**: Implement file picker and local file storage
- [x] **ORION-004b**: Build tab list with search and metadata display
- [x] **ORION-004c**: Add rename and delete with confirmation
- [x] **ORION-004d**: Build PDF viewer screen with page navigation
- [x] **ORION-004e**: Integrate with genericStorageService for cloud sync
