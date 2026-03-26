import { useState, useEffect, useRef, useCallback } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useSync } from '../context/SyncContext';
import { useUserProfile } from '../context/UserProfileContext';
import { AlertModal } from '../components/AlertModal';
import {
  getVoiceMemos,
  addVoiceMemo,
  deleteVoiceMemo,
  renameVoiceMemo,
  toggleLikeVoiceMemo,
  toggleReaction,
  syncVoiceMemoToSupabase,
  deleteVoiceMemoFromSupabase,
} from '../services/voiceMemoStorageService';

// Common emoji reactions (Instagram-style)
const REACTION_EMOJIS = ['❤️', '🔥', '👏', '😂', '😮', '😢'];
import {
  playMusic,
  stopMusic,
  getCurrentMusicId,
} from '../services/audioPlaybackService';
import { formatDuration } from '../utils/formatters';

// Compact waveform visualization
function WaveformVisualizer({ isPlaying, theme, progress = 0, isOwn }) {
  const [bars] = useState(() =>
    Array.from({ length: 16 }, () => 0.3 + Math.random() * 0.7),
  );

  return (
    <View style={waveStyles.container}>
      {bars.map((height, index) => {
        const isPast = progress > index / bars.length;
        return (
          <View
            key={index}
            style={[
              waveStyles.bar,
              {
                height: height * 20,
                backgroundColor: isPast
                  ? isOwn
                    ? theme.colors.tunerGreen
                    : theme.colors.text
                  : theme.colors.textMuted,
                opacity: isPlaying ? 1 : 0.5,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    gap: 2,
    flex: 1,
  },
  bar: {
    width: 2,
    borderRadius: 1,
  },
});

// Voice Memo Item Component - Chat style
function VoiceMemoItem({
  item,
  theme,
  onLongPress,
  onLike,
  onShowReactionPicker,
  isOwn,
  displayName,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);

  useEffect(() => {
    const currentId = getCurrentMusicId();
    setIsPlaying(currentId === item.id);
  }, [item.id]);

  const handleStatusUpdate = useCallback((status) => {
    setIsPlaying(status.isPlaying);
    if (status.positionMillis && status.durationMillis) {
      setProgress(status.positionMillis / status.durationMillis);
      setCurrentPosition(status.positionMillis);
    }
    if (status.didJustFinish) {
      setIsPlaying(false);
      setProgress(0);
      setCurrentPosition(0);
    }
  }, []);

  const handlePlay = async () => {
    try {
      await playMusic(item.uri, item.id, handleStatusUpdate);
    } catch (error) {
      console.error('Error playing memo:', error);
    }
  };

  const handleStop = async () => {
    try {
      await stopMusic();
      setIsPlaying(false);
      setProgress(0);
      setCurrentPosition(0);
    } catch (error) {
      console.error('Error stopping memo:', error);
    }
  };

  // Handle long press - show reaction picker for others' memos, delete/rename for own
  const handleLongPress = () => {
    if (isOwn) {
      // Own memo - show rename/delete options
      onLongPress?.(item);
    } else {
      // Others' memos - show reaction picker
      onShowReactionPicker?.(item);
    }
  };

  const styles = createMemoStyles(theme, isOwn);

  return (
    <View style={styles.messageRow}>
      {!isOwn && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.userName || 'A').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.bubble}
        onLongPress={handleLongPress}
        activeOpacity={0.8}
      >
        {/* User name for others */}
        {!isOwn && (
          <Text style={styles.userName}>{item.userName || 'Anonymous'}</Text>
        )}

        {/* Player row */}
        <View style={styles.playerRow}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={isPlaying ? handleStop : handlePlay}
          >
            {isPlaying ? (
              <View style={styles.stopIcon} />
            ) : (
              <View style={styles.playIcon} />
            )}
          </TouchableOpacity>

          <WaveformVisualizer
            isPlaying={isPlaying}
            theme={theme}
            progress={progress}
            isOwn={isOwn}
          />
        </View>

        {/* Bottom row: duration and like */}
        <View style={styles.bottomRow}>
          <Text style={styles.duration}>
            {isPlaying
              ? formatDuration(currentPosition)
              : formatDuration(item.duration)}
          </Text>

          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => onLike?.(item)}
          >
            <Text
              style={[styles.likeIcon, item.liked && styles.likeIconActive]}
            >
              {item.liked ? 'Liked' : 'Like'}
            </Text>
            {item.likes > 0 && (
              <Text style={styles.likeCount}>{item.likes}</Text>
            )}
          </TouchableOpacity>
        </View>

      </TouchableOpacity>

      {/* Single reaction floating badge */}
      {item.reaction && (
        <View style={[styles.reactionsFloating, isOwn ? styles.reactionsFloatingOwn : styles.reactionsFloatingOther]}>
          <Text style={styles.reactionFloatingEmoji}>{item.reaction}</Text>
        </View>
      )}

      {isOwn && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(displayName || 'Y').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

const createMemoStyles = (theme, isOwn) =>
  StyleSheet.create({
    messageRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 16,
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      paddingHorizontal: 4,
      position: 'relative',
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isOwn ? theme.colors.tunerGreen : theme.colors.textMuted,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 6,
    },
    avatarText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    bubble: {
      backgroundColor: isOwn ? theme.colors.tunerGreen : theme.colors.surface,
      borderRadius: 16,
      borderBottomRightRadius: isOwn ? 4 : 16,
      borderBottomLeftRadius: isOwn ? 16 : 4,
      padding: 10,
      maxWidth: '70%',
      minWidth: 180,
      borderWidth: isOwn ? 0 : 1,
      borderColor: theme.colors.border,
    },
    userName: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 6,
    },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    playButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isOwn ? 'rgba(255,255,255,0.3)' : theme.colors.text,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playIcon: {
      width: 0,
      height: 0,
      borderStyle: 'solid',
      borderTopWidth: 6,
      borderBottomWidth: 6,
      borderLeftWidth: 10,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      borderLeftColor: isOwn ? 'white' : theme.colors.background,
      marginLeft: 2,
    },
    stopIcon: {
      width: 10,
      height: 10,
      backgroundColor: isOwn ? 'white' : theme.colors.background,
      borderRadius: 2,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    duration: {
      fontSize: 11,
      color: isOwn ? 'rgba(255,255,255,0.8)' : theme.colors.textMuted,
    },
    likeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    likeIcon: {
      fontSize: 11,
      color: isOwn ? 'rgba(255,255,255,0.8)' : theme.colors.textMuted,
    },
    likeIconActive: {
      color: isOwn ? 'white' : theme.colors.tunerOrange,
      fontWeight: '600',
    },
    likeCount: {
      fontSize: 11,
      color: isOwn ? 'rgba(255,255,255,0.8)' : theme.colors.textMuted,
    },
    reactionsFloating: {
      position: 'absolute',
      bottom: -8,
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      paddingHorizontal: 4,
      paddingVertical: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    reactionsFloatingOwn: {
      right: 40,
    },
    reactionsFloatingOther: {
      left: 40,
    },
    reactionFloatingEmoji: {
      fontSize: 12,
      marginHorizontal: 1,
    },
  });

// Floating Record Button - White/minimal
function FloatingRecordButton({
  isRecording,
  onPress,
  recordingDuration,
  theme,
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const styles = createFloatingStyles(theme);

  return (
    <View style={styles.floatingContainer}>
      {isRecording && (
        <View style={styles.recordingInfo}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingTime}>
            {formatDuration(recordingDuration)}
          </Text>
        </View>
      )}
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          {isRecording ? (
            <View style={styles.stopIcon} />
          ) : (
            <View style={styles.micIcon} />
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const createFloatingStyles = (theme) =>
  StyleSheet.create({
    floatingContainer: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      alignItems: 'flex-end',
    },
    recordingInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    recordingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#ef4444',
      marginRight: 8,
    },
    recordingTime: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ef4444',
      fontVariant: ['tabular-nums'],
    },
    recordButton: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    recordButtonActive: {
      backgroundColor: '#ef4444',
      borderColor: '#ef4444',
    },
    micIcon: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#1a1a1a',
    },
    stopIcon: {
      width: 16,
      height: 16,
      backgroundColor: 'white',
      borderRadius: 3,
    },
  });

export function VoiceMemosScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const { isEnabled: syncEnabled } = useSync();
  const { displayName } = useUserProfile();

  const [memos, setMemos] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Name modal state
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [newMemoUri, setNewMemoUri] = useState(null);
  const [newMemoName, setNewMemoName] = useState('');

  // Rename modal state
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [renameName, setRenameName] = useState('');

  // Alert modal state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    buttons: [],
  });

  // Reaction picker state
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);
  const [reactionMemo, setReactionMemo] = useState(null);

  const recordingTimer = useRef(null);

  const styles = createStyles(theme);

  const showAlert = (title, message, buttons = []) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  useEffect(() => {
    loadMemos();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadMemos();
    });
    return unsubscribe;
  }, [navigation]);

  // Stop playback when leaving tab
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      stopMusic();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      stopMusic();
    };
  }, []);

  const loadMemos = async () => {
    try {
      const savedMemos = await getVoiceMemos();
      setMemos(savedMemos);
    } catch (error) {
      console.error('Error loading memos:', error);
      showToast('Failed to load voice memos', 'error');
    }
  };

  const filteredMemos = memos.filter(
    (memo) =>
      memo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (memo.userName &&
        memo.userName.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        showToast('Microphone permission required', 'error');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      await stopMusic();

      // Use compressed format (m4a) for smaller file size
      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 22050,
          numberOfChannels: 1,
          bitRate: 64000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: 22050,
          numberOfChannels: 1,
          bitRate: 64000,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 64000,
        },
      });

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimer.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1000);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      showToast('Failed to start recording', 'error');
    }
  };

  const stopRecordingAndSave = async () => {
    try {
      if (!recording) return;

      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setRecording(null);
      setIsRecording(false);

      if (uri) {
        setNewMemoUri(uri);
        setNewMemoName(`Memo ${memos.length + 1}`);
        setNameModalVisible(true);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      showToast('Failed to save recording', 'error');
      setIsRecording(false);
      setRecording(null);
    }
  };

  const handleSaveMemo = async () => {
    if (!newMemoName.trim() || !newMemoUri) {
      showToast('Please enter a name', 'warning');
      return;
    }

    try {
      const newMemo = await addVoiceMemo(
        newMemoUri,
        newMemoName.trim(),
        recordingDuration,
        displayName || 'Anonymous',
      );
      setNameModalVisible(false);
      setNewMemoUri(null);
      setNewMemoName('');
      setRecordingDuration(0);
      loadMemos();
      showToast('Voice memo saved', 'success');

      if (syncEnabled && newMemo) {
        try {
          const syncResult = await syncVoiceMemoToSupabase(newMemo);
          if (syncResult.success && !syncResult.skipped) {
            showToast('Synced to cloud', 'success');
          }
        } catch (error) {
          // Silently fail - bucket may not exist
        }
      }
    } catch (error) {
      console.error('Error saving memo:', error);
      showToast('Failed to save voice memo', 'error');
    }
  };

  const handleRecordPress = () => {
    if (isRecording) {
      stopRecordingAndSave();
    } else {
      startRecording();
    }
  };

  const handleLike = async (memo) => {
    try {
      await toggleLikeVoiceMemo(memo.id);
      loadMemos();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleShowReactionPicker = (memo) => {
    setReactionMemo(memo);
    setReactionPickerVisible(true);
  };

  const handleReaction = async (emoji) => {
    if (!reactionMemo) return;
    try {
      await toggleReaction(reactionMemo.id, emoji);
      setReactionPickerVisible(false);
      setReactionMemo(null);
      loadMemos();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const handleLongPress = (memo) => {
    showAlert(memo.name, 'What would you like to do?', [
      {
        text: 'Rename',
        onPress: () => {
          setAlertVisible(false);
          setSelectedMemo(memo);
          setRenameName(memo.name);
          setRenameModalVisible(true);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setAlertVisible(false);
          confirmDelete(memo);
        },
      },
    ]);
  };

  const confirmDelete = (memo) => {
    showAlert(
      'Delete Voice Memo',
      `Are you sure you want to delete "${memo.name}"?`,
      [
        { text: 'Cancel', onPress: () => setAlertVisible(false) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setAlertVisible(false);
            try {
              await stopMusic();
              await deleteVoiceMemo(memo.id);

              // Also delete from cloud if sync is enabled
              if (syncEnabled) {
                try {
                  await deleteVoiceMemoFromSupabase(memo.id, memo.extension);
                } catch {
                  // Silently fail - file may not exist in cloud
                }
              }

              loadMemos();
              showToast('Voice memo deleted', 'success');
            } catch (error) {
              showToast('Failed to delete voice memo', 'error');
            }
          },
        },
      ],
    );
  };

  const handleRename = async () => {
    if (!renameName.trim()) {
      showToast('Please enter a name', 'warning');
      return;
    }

    try {
      await renameVoiceMemo(selectedMemo.id, renameName.trim());
      setRenameModalVisible(false);
      setSelectedMemo(null);
      setRenameName('');
      loadMemos();
      showToast('Voice memo renamed', 'success');
    } catch (error) {
      showToast('Failed to rename voice memo', 'error');
    }
  };

  const isOwnMemo = (memo) => {
    return (
      memo.userName === displayName ||
      (!memo.userName && !displayName) ||
      (memo.userName === 'Anonymous' && !displayName)
    );
  };

  const renderMemoItem = ({ item }) => (
    <VoiceMemoItem
      item={item}
      theme={theme}
      onLongPress={handleLongPress}
      onLike={handleLike}
      onShowReactionPicker={handleShowReactionPicker}
      isOwn={isOwnMemo(item)}
      displayName={displayName}
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <View style={styles.emptyIconInner} />
      </View>
      <Text style={styles.emptyTitle}>No voice memos yet</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'No results found' : 'Tap the button to record'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Voice Memos</Text>
        <Text style={styles.subtitle}>
          {memos.length} {memos.length === 1 ? 'memo' : 'memos'}
        </Text>
      </View>

      {/* Search Bar */}
      {memos.length > 0 && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search memos..."
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
              <Text style={styles.clearText}>x</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Memos List */}
      <FlatList
        data={filteredMemos}
        renderItem={renderMemoItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Record Button */}
      <FloatingRecordButton
        isRecording={isRecording}
        onPress={handleRecordPress}
        recordingDuration={recordingDuration}
        theme={theme}
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

      {/* Reaction Picker Modal */}
      {reactionPickerVisible && (
        <View style={styles.reactionPickerOverlay}>
          <TouchableOpacity
            style={styles.reactionPickerBackdrop}
            activeOpacity={1}
            onPress={() => {
              setReactionPickerVisible(false);
              setReactionMemo(null);
            }}
          />
          <View style={styles.reactionPickerContainer}>
            {REACTION_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionEmojiButton}
                onPress={() => handleReaction(emoji)}
              >
                <Text style={styles.reactionEmojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Name Modal */}
      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Voice Memo</Text>
            <TextInput
              style={styles.modalInput}
              value={newMemoName}
              onChangeText={setNewMemoName}
              placeholder="Enter memo name"
              placeholderTextColor={theme.colors.textMuted}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setNameModalVisible(false);
                  setNewMemoUri(null);
                  setNewMemoName('');
                }}
              >
                <Text style={styles.modalButtonText}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveMemo}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalButtonTextPrimary,
                  ]}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
            <Text style={styles.modalTitle}>Rename Voice Memo</Text>
            <TextInput
              style={styles.modalInput}
              value={renameName}
              onChangeText={setRenameName}
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
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalButtonTextPrimary,
                  ]}
                >
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

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    searchContainer: {
      marginHorizontal: 20,
      marginBottom: 12,
      position: 'relative',
    },
    searchInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
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
      fontSize: 16,
      color: theme.colors.textMuted,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 100,
      flexGrow: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyIconInner: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.textMuted,
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
    reactionPickerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    reactionPickerBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    reactionPickerContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 28,
      paddingHorizontal: 8,
      paddingVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    reactionEmojiButton: {
      padding: 10,
    },
    reactionEmojiText: {
      fontSize: 28,
    },
  });

export default VoiceMemosScreen;
