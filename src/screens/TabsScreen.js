import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useSync } from '../context/SyncContext';
import { AlertModal } from '../components/AlertModal';
import { MusicItem } from '../components/MusicItem';
import { CloudStorageIndicator } from '../components/CloudStorageIndicator';
import { getTabs, addTab, deleteTab, renameTab } from '../services/tabsStorage';
import {
  getMusicFiles,
  addMusicFile,
  deleteMusicFile,
  renameMusicFile,
  syncMusicToSupabase,
  deleteMusicFromSupabase,
} from '../services/musicStorageService';
import { deleteTabFromSupabase } from '../services/supabaseStorageService';
import { getAudioDuration, stopMusic } from '../services/audioPlaybackService';

export function TabsScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const { isEnabled: syncEnabled, syncSingleTab } = useSync();

  const [activeTab, setActiveTab] = useState('pdfs'); // 'pdfs' or 'music'
  const [tabs, setTabs] = useState([]);
  const [musicFiles, setMusicFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newName, setNewName] = useState('');
  const [, setIsLoading] = useState(true);

  // Alert modal state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

  const styles = createStyles(theme);

  const showAlert = (title, message, buttons = []) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Reload when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  // Stop music when switching tabs
  useEffect(() => {
    if (activeTab === 'pdfs') {
      stopMusic();
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      const [savedTabs, savedMusic] = await Promise.all([
        getTabs(),
        getMusicFiles(),
      ]);
      setTabs(savedTabs);
      setMusicFiles(savedMusic);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data by search query
  const filteredTabs = tabs.filter(tab =>
    tab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tab.instrument.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMusic = musicFiles.filter(music =>
    music.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTab = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        const name = file.name.replace('.pdf', '').replace(/_/g, ' ');

        const newTab = await addTab(file.uri, name, 'Guitar');
        loadData();
        showToast('Tab added successfully', 'success');

        // Sync to cloud if enabled
        if (syncEnabled && newTab) {
          const syncResult = await syncSingleTab(newTab);
          if (syncResult.success && !syncResult.skipped) {
            showToast('Synced to cloud', 'success');
          }
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      showToast('Failed to add PDF', 'error');
    }
  };

  const handleAddMusic = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'audio/*',           // Wildcard for all audio types
          'audio/mpeg',        // MP3
          'audio/mp3',         // MP3 alternate
          'audio/wav',         // WAV
          'audio/x-wav',       // WAV alternate
          'audio/mp4',         // M4A/AAC
          'audio/x-m4a',       // M4A alternate
          'audio/m4a',         // M4A
          'audio/aac',         // AAC
          'audio/ogg',         // OGG
          'audio/flac',        // FLAC
          'audio/x-flac',      // FLAC alternate
          'audio/3gpp',        // 3GP audio
          'audio/3gpp2',       // 3GP2 audio
          'audio/webm',        // WebM audio
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        // Remove common audio extensions from filename
        const name = file.name
          .replace(/\.(mp3|wav|m4a|aac|ogg|flac|3gp|webm|wma|opus)$/i, '')
          .replace(/_/g, ' ');

        // Get audio duration
        const duration = await getAudioDuration(file.uri);

        const newMusic = await addMusicFile(file.uri, name, duration);
        loadData();
        showToast('Music added successfully', 'success');

        // Sync to cloud if enabled
        if (syncEnabled && newMusic) {
          try {
            const syncResult = await syncMusicToSupabase(newMusic);
            if (syncResult.success && !syncResult.skipped) {
              showToast('Synced to cloud', 'success');
            }
          } catch (error) {
            console.warn('Failed to sync music:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error picking music:', error);
      showToast('Failed to add music', 'error');
    }
  };

  const handleAdd = () => {
    if (activeTab === 'pdfs') {
      handleAddTab();
    } else {
      handleAddMusic();
    }
  };

  const handleOpenTab = (tab) => {
    navigation.navigate('PdfViewer', { tab });
  };

  const handleLongPress = (item) => {
    showAlert(
      item.name,
      'What would you like to do?',
      [
        {
          text: 'Rename',
          onPress: () => {
            setAlertVisible(false);
            setSelectedItem(item);
            setNewName(item.name);
            setRenameModalVisible(true);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAlertVisible(false);
            confirmDelete(item);
          },
        },
      ]
    );
  };

  const confirmDelete = (item) => {
    showAlert(
      activeTab === 'pdfs' ? 'Delete Tab' : 'Delete Music',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', onPress: () => setAlertVisible(false) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setAlertVisible(false);
            try {
              if (activeTab === 'pdfs') {
                await deleteTab(item.id);
                // Also delete from cloud if sync is enabled
                if (syncEnabled) {
                  try {
                    await deleteTabFromSupabase(item.id);
                  } catch {
                    // Silently fail - file may not exist in cloud
                  }
                }
              } else {
                await stopMusic();
                await deleteMusicFile(item.id);
                // Also delete from cloud if sync is enabled
                if (syncEnabled) {
                  try {
                    await deleteMusicFromSupabase(item.id, item.extension);
                  } catch {
                    // Silently fail - file may not exist in cloud
                  }
                }
              }
              loadData();
              showToast(`${activeTab === 'pdfs' ? 'Tab' : 'Music'} deleted`, 'success');
            } catch (error) {
              showToast(`Failed to delete ${activeTab === 'pdfs' ? 'tab' : 'music'}`, 'error');
            }
          },
        },
      ]
    );
  };

  const handleRename = async () => {
    if (!newName.trim()) {
      showToast('Please enter a name', 'warning');
      return;
    }

    try {
      if (activeTab === 'pdfs') {
        await renameTab(selectedItem.id, newName.trim());
      } else {
        await renameMusicFile(selectedItem.id, newName.trim());
      }
      setRenameModalVisible(false);
      setSelectedItem(null);
      setNewName('');
      loadData();
      showToast(`${activeTab === 'pdfs' ? 'Tab' : 'Music'} renamed`, 'success');
    } catch (error) {
      showToast(`Failed to rename ${activeTab === 'pdfs' ? 'tab' : 'music'}`, 'error');
    }
  };

  const renderTabItem = ({ item }) => (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={() => handleOpenTab(item)}
      onLongPress={() => handleLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.tabInfo}>
        <Text style={styles.tabName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.tabMeta}>{item.instrument}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  const handleOpenMusic = (music) => {
    stopMusic();
    navigation.navigate('MusicPlayer', { music });
  };

  const renderMusicItem = ({ item }) => (
    <MusicItem
      item={item}
      theme={theme}
      onPress={handleOpenMusic}
      onLongPress={handleLongPress}
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        {activeTab === 'pdfs' ? 'No tabs yet' : 'No music yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'No results found'
          : activeTab === 'pdfs'
            ? 'Tap + to add your first PDF tab'
            : 'Tap + to add your first music file'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentButton, activeTab === 'pdfs' && styles.segmentButtonActive]}
          onPress={() => setActiveTab('pdfs')}
        >
          <Text style={[styles.segmentText, activeTab === 'pdfs' && styles.segmentTextActive]}>
            PDF Tabs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, activeTab === 'music' && styles.segmentButtonActive]}
          onPress={() => setActiveTab('music')}
        >
          <Text style={[styles.segmentText, activeTab === 'music' && styles.segmentTextActive]}>
            Music
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cloud Storage Indicator */}
      <View style={styles.storageContainer}>
        <CloudStorageIndicator theme={theme} isEnabled={syncEnabled} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab === 'pdfs' ? 'tabs' : 'music'}...`}
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={activeTab === 'pdfs' ? filteredTabs : filteredMusic}
        renderItem={activeTab === 'pdfs' ? renderTabItem : renderMusicItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
      />

      {/* Alert Modal */}
      <AlertModal
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
        theme={theme}
      />

      {/* Rename Modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Rename {activeTab === 'pdfs' ? 'Tab' : 'Music'}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter new name"
              placeholderTextColor={theme.colors.textMuted}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleRename}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 22,
    color: theme.colors.text,
    fontWeight: '300',
    marginTop: -1,
  },
  segmentedContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: theme.colors.text,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  segmentTextActive: {
    color: theme.colors.background,
  },
  storageContainer: {
    paddingHorizontal: 20,
  },
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabInfo: {
    flex: 1,
  },
  tabName: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  tabMeta: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  arrow: {
    fontSize: 20,
    color: theme.colors.textMuted,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalButtonPrimary: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  modalButtonText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  modalButtonTextPrimary: {
    color: theme.colors.background,
  },
});
