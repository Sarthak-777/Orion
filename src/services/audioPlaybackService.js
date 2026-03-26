import { Audio } from 'expo-av';

let currentSound = null;
let currentMusicId = null;
let playbackStatusCallback = null;

// Configure audio for playback
async function configurePlayback() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
  });
}

// Load and play a music file
export async function playMusic(uri, musicId, onStatusUpdate) {
  try {
    // If same music is playing, toggle play/pause
    if (currentMusicId === musicId && currentSound) {
      const status = await currentSound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await currentSound.pauseAsync();
          if (onStatusUpdate) onStatusUpdate({ isPlaying: false, positionMillis: status.positionMillis });
          return { action: 'paused' };
        } else {
          await currentSound.playAsync();
          if (onStatusUpdate) onStatusUpdate({ isPlaying: true, positionMillis: status.positionMillis });
          return { action: 'resumed' };
        }
      }
    }

    // Stop current sound if different music
    await stopMusic();

    await configurePlayback();

    playbackStatusCallback = onStatusUpdate;

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true },
      (status) => {
        if (status.isLoaded && playbackStatusCallback) {
          playbackStatusCallback({
            isPlaying: status.isPlaying,
            positionMillis: status.positionMillis,
            durationMillis: status.durationMillis,
            didJustFinish: status.didJustFinish,
          });
        }
        if (status.didJustFinish) {
          stopMusic();
        }
      }
    );

    currentSound = sound;
    currentMusicId = musicId;

    return { action: 'playing' };
  } catch (error) {
    console.error('Error playing music:', error);
    throw error;
  }
}

// Stop playing music
export async function stopMusic() {
  try {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    }
  } catch (error) {
    console.error('Error stopping music:', error);
  } finally {
    currentSound = null;
    currentMusicId = null;
    playbackStatusCallback = null;
  }
}

// Pause music
export async function pauseMusic() {
  try {
    if (currentSound) {
      await currentSound.pauseAsync();
    }
  } catch (error) {
    console.error('Error pausing music:', error);
  }
}

// Resume music
export async function resumeMusic() {
  try {
    if (currentSound) {
      await currentSound.playAsync();
    }
  } catch (error) {
    console.error('Error resuming music:', error);
  }
}

// Seek to position
export async function seekMusic(positionMillis) {
  try {
    if (currentSound) {
      await currentSound.setPositionAsync(positionMillis);
    }
  } catch (error) {
    console.error('Error seeking music:', error);
  }
}

// Get current playback status
export async function getPlaybackStatus() {
  try {
    if (currentSound) {
      return await currentSound.getStatusAsync();
    }
    return null;
  } catch (error) {
    console.error('Error getting playback status:', error);
    return null;
  }
}

// Get currently playing music ID
export function getCurrentMusicId() {
  return currentMusicId;
}

// Check if a specific music is currently playing
export function isPlaying(musicId) {
  return currentMusicId === musicId;
}

// Get audio file duration
export async function getAudioDuration(uri) {
  try {
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    const status = await sound.getStatusAsync();
    await sound.unloadAsync();
    return status.durationMillis || 0;
  } catch (error) {
    console.error('Error getting audio duration:', error);
    return 0;
  }
}
