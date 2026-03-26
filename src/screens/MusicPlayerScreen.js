import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { useTheme } from '../context/ThemeContext';
import { formatDuration } from '../utils/formatters';

// Interactive waveform: drag to seek + draggable A/B loop markers
function WaveformSeekBar({ progress, duration, onSeek, loopA, loopB, isLoopActive, theme, onLoopAChange, onLoopBChange, onScrollEnabledChange }) {
  const [bars] = useState(() =>
    Array.from({ length: 50 }, () => 0.2 + Math.random() * 0.8)
  );
  const trackWidth = useRef(0);
  const trackLeft = useRef(0);
  const viewRef = useRef(null);
  const [seekProgress, setSeekProgress] = useState(null);
  const seekProgressRef = useRef(null);
  const [markerDrag, setMarkerDrag] = useState(null);
  const dragModeRef = useRef(null);

  const propsRef = useRef({});
  propsRef.current = { duration, onSeek, loopA, loopB, isLoopActive, onLoopAChange, onLoopBChange, onScrollEnabledChange };

  const getProgress = (pageX) => {
    if (trackWidth.current <= 0) return null;
    const x = pageX - trackLeft.current;
    return Math.max(0, Math.min(1, x / trackWidth.current));
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (evt) => {
      const props = propsRef.current;
      props.onScrollEnabledChange?.(false);

      viewRef.current?.measure?.((x, y, w, h, px) => {
        trackLeft.current = px;
        trackWidth.current = w;
      });

      const pageX = evt.nativeEvent.pageX;
      const tw = trackWidth.current;
      const dur = props.duration;

      // Check if near loop markers when loop is active
      if (tw > 0 && dur > 0 && props.isLoopActive) {
        const touchX = pageX - trackLeft.current;
        const threshold = 25;

        if (props.loopB !== null) {
          const markerX = (props.loopB / dur) * tw;
          if (Math.abs(touchX - markerX) < threshold) {
            dragModeRef.current = 'B';
            setMarkerDrag({ which: 'B', position: props.loopB });
            return;
          }
        }
        if (props.loopA !== null) {
          const markerX = (props.loopA / dur) * tw;
          if (Math.abs(touchX - markerX) < threshold) {
            dragModeRef.current = 'A';
            setMarkerDrag({ which: 'A', position: props.loopA });
            return;
          }
        }
      }

      dragModeRef.current = 'seek';
      let p = getProgress(pageX);
      // Clamp seek to loop bounds
      if (p !== null && props.isLoopActive && props.loopA !== null && props.loopB !== null && dur > 0) {
        const minP = props.loopA / dur;
        const maxP = props.loopB / dur;
        p = Math.max(minP, Math.min(maxP, p));
      }
      if (p !== null) {
        seekProgressRef.current = p;
        setSeekProgress(p);
      }
    },
    onPanResponderMove: (evt) => {
      let p = getProgress(evt.nativeEvent.pageX);
      if (p === null) return;

      const mode = dragModeRef.current;
      if (mode === 'A' || mode === 'B') {
        const dur = propsRef.current.duration;
        if (dur > 0) setMarkerDrag({ which: mode, position: p * dur });
      } else {
        // Clamp seek to loop bounds
        const props = propsRef.current;
        if (props.isLoopActive && props.loopA !== null && props.loopB !== null && props.duration > 0) {
          const minP = props.loopA / props.duration;
          const maxP = props.loopB / props.duration;
          p = Math.max(minP, Math.min(maxP, p));
        }
        seekProgressRef.current = p;
        setSeekProgress(p);
      }
    },
    onPanResponderRelease: (evt) => {
      const props = propsRef.current;
      let p = getProgress(evt.nativeEvent.pageX);
      const mode = dragModeRef.current;

      if (mode === 'A' || mode === 'B') {
        const dur = props.duration;
        if (dur > 0 && p !== null) {
          let newPos = Math.max(0, Math.min(dur, p * dur));
          if (mode === 'A' && props.loopB !== null) newPos = Math.min(newPos, props.loopB - 500);
          if (mode === 'B' && props.loopA !== null) newPos = Math.max(newPos, props.loopA + 500);
          newPos = Math.max(0, newPos);
          if (mode === 'A') props.onLoopAChange?.(newPos);
          else props.onLoopBChange?.(newPos);
        }
        setMarkerDrag(null);
      } else {
        // Clamp seek to loop bounds
        if (p !== null && props.isLoopActive && props.loopA !== null && props.loopB !== null && props.duration > 0) {
          const minP = props.loopA / props.duration;
          const maxP = props.loopB / props.duration;
          p = Math.max(minP, Math.min(maxP, p));
        }
        const finalProgress = p !== null ? p : seekProgressRef.current;
        if (finalProgress !== null && props.duration > 0) {
          props.onSeek?.(finalProgress * props.duration);
        }
        setTimeout(() => {
          seekProgressRef.current = null;
          setSeekProgress(null);
        }, 150);
      }

      dragModeRef.current = null;
      props.onScrollEnabledChange?.(true);
    },
    onPanResponderTerminate: () => {
      dragModeRef.current = null;
      seekProgressRef.current = null;
      setSeekProgress(null);
      setMarkerDrag(null);
      propsRef.current.onScrollEnabledChange?.(true);
    },
  })).current;

  const displayProgress = seekProgress !== null ? seekProgress : progress;
  const loopAPos = markerDrag?.which === 'A' ? markerDrag.position : loopA;
  const loopBPos = markerDrag?.which === 'B' ? markerDrag.position : loopB;

  return (
    <View
      ref={viewRef}
      style={waveStyles(theme).container}
      onLayout={(e) => {
        trackWidth.current = e.nativeEvent.layout.width;
        viewRef.current?.measure?.((x, y, w, h, px) => {
          trackLeft.current = px;
        });
      }}
      {...panResponder.panHandlers}
    >
      {/* Loop region highlight */}
      {loopAPos !== null && loopBPos !== null && isLoopActive && duration > 0 && (
        <View pointerEvents="none" style={[waveStyles(theme).loopRegion, {
          left: `${(loopAPos / duration) * 100}%`,
          width: `${((loopBPos - loopAPos) / duration) * 100}%`,
        }]} />
      )}

      {/* Waveform bars */}
      {bars.map((height, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height: height * 56,
            borderRadius: 1.5,
            backgroundColor: displayProgress > (index / bars.length)
              ? theme.colors.text
              : theme.colors.border,
          }}
        />
      ))}

      {/* Loop markers */}
      {loopAPos !== null && isLoopActive && duration > 0 && (
        <View pointerEvents="none" style={[waveStyles(theme).loopMarker, {
          left: `${(loopAPos / duration) * 100}%`,
        }]} />
      )}
      {loopBPos !== null && isLoopActive && duration > 0 && (
        <View pointerEvents="none" style={[waveStyles(theme).loopMarker, {
          left: `${(loopBPos / duration) * 100}%`,
        }]} />
      )}
    </View>
  );
}

const waveStyles = (theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 80,
    gap: 2,
    paddingHorizontal: 20,
  },
  loopRegion: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: theme.colors.text,
    opacity: 0.08,
  },
  loopMarker: {
    position: 'absolute',
    width: 3,
    top: -4,
    bottom: -4,
    backgroundColor: theme.colors.text,
    opacity: 0.7,
    marginLeft: -1.5,
    borderRadius: 1.5,
  },
});

// Speed slider with PanResponder
function SpeedSlider({ speed, onSpeedChange, theme, onScrollEnabledChange }) {
  const sliderWidth = useRef(0);
  const sliderLeft = useRef(0);
  const sliderRef = useRef(null);

  const MIN_SPEED = 0.25;
  const MAX_SPEED = 1.0;

  const speedToPercent = (s) => (s - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);

  const propsRef = useRef({});
  propsRef.current = { onSpeedChange, onScrollEnabledChange };

  const pageXToSpeed = (pageX) => {
    if (sliderWidth.current <= 0) return null;
    const x = pageX - sliderLeft.current;
    const clamped = Math.max(0, Math.min(x, sliderWidth.current));
    const raw = MIN_SPEED + (clamped / sliderWidth.current) * (MAX_SPEED - MIN_SPEED);
    return Math.round(raw * 100) / 100;
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (evt) => {
      propsRef.current.onScrollEnabledChange?.(false);
      sliderRef.current?.measure?.((x, y, w, h, px) => {
        sliderLeft.current = px;
        sliderWidth.current = w;
        const s = pageXToSpeed(evt.nativeEvent.pageX);
        if (s !== null) propsRef.current.onSpeedChange(s);
      });
      const s = pageXToSpeed(evt.nativeEvent.pageX);
      if (s !== null) propsRef.current.onSpeedChange(s);
    },
    onPanResponderMove: (evt) => {
      const s = pageXToSpeed(evt.nativeEvent.pageX);
      if (s !== null) propsRef.current.onSpeedChange(s);
    },
    onPanResponderRelease: () => {
      propsRef.current.onScrollEnabledChange?.(true);
    },
    onPanResponderTerminate: () => {
      propsRef.current.onScrollEnabledChange?.(true);
    },
  })).current;

  const percent = speedToPercent(speed);

  return (
    <View
      ref={sliderRef}
      style={sliderStyles(theme).container}
      onLayout={(e) => {
        sliderWidth.current = e.nativeEvent.layout.width;
        sliderRef.current?.measure?.((x, y, w, h, px) => {
          sliderLeft.current = px;
        });
      }}
      {...panResponder.panHandlers}
    >
      <View style={sliderStyles(theme).track}>
        <View style={[sliderStyles(theme).fill, { width: `${percent * 100}%` }]} />
      </View>
      <View
        style={[sliderStyles(theme).thumb, {
          left: `${percent * 100}%`,
          marginLeft: -10,
        }]}
      />
    </View>
  );
}

const sliderStyles = (theme) => StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    height: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: theme.colors.text,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.text,
    top: 10,
  },
});

export function MusicPlayerScreen({ route, navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { music } = route.params || {};

  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(music?.duration || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);

  // A/B Loop state
  const [loopA, setLoopA] = useState(null);
  const [loopB, setLoopB] = useState(null);
  const [isLoopActive, setIsLoopActive] = useState(false);
  const loopRef = useRef({ active: false, a: null, b: null });
  const isLoopSeekingRef = useRef(false);

  const [scrollEnabled, setScrollEnabled] = useState(true);

  const styles = createStyles(theme);

  // Keep loop ref in sync — synchronous during render (no useEffect delay)
  loopRef.current = { active: isLoopActive, a: loopA, b: loopB };

  const onPlaybackStatusUpdate = useCallback((status) => {
    if (status.isLoaded) {
      const pos = status.positionMillis || 0;
      const dur = status.durationMillis || 0;
      setDuration(dur);
      setIsPlaying(status.isPlaying);

      // A/B Loop enforcement
      const loop = loopRef.current;
      if (loop.active && loop.a !== null && loop.b !== null) {
        if (status.isPlaying && pos >= loop.b && !isLoopSeekingRef.current) {
          // Snap back to loop start (with guard to prevent re-entrant seeks)
          isLoopSeekingRef.current = true;
          soundRef.current?.setPositionAsync(loop.a)
            .then(() => { isLoopSeekingRef.current = false; })
            .catch(() => { isLoopSeekingRef.current = false; });
          setPosition(loop.a);
          return;
        }
        // Clamp displayed position to loop bounds
        setPosition(Math.max(loop.a, Math.min(loop.b, pos)));
      } else {
        setPosition(pos);
      }

      if (status.didJustFinish) {
        if (loop.active && loop.a !== null && loop.b !== null) {
          isLoopSeekingRef.current = true;
          soundRef.current?.setPositionAsync(loop.a)
            .then(() => {
              isLoopSeekingRef.current = false;
              soundRef.current?.playAsync();
            })
            .catch(() => { isLoopSeekingRef.current = false; });
        } else {
          setIsPlaying(false);
          setPosition(0);
        }
      }
    }
  }, []);

  // Load audio on mount
  useEffect(() => {
    loadAudio();
    return () => {
      unloadAudio();
    };
  }, []);

  // Stop audio when navigating away
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    });
    return unsubscribe;
  }, [navigation]);

  const loadAudio = async () => {
    if (!music?.uri) {
      setIsLoading(false);
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: music.uri },
        {
          shouldPlay: false,
          rate: playbackSpeed,
          shouldCorrectPitch: true,
          progressUpdateIntervalMillis: 50,
        },
        onPlaybackStatusUpdate
      );

      soundRef.current = newSound;
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading audio:', error);
      setIsLoading(false);
    }
  };

  const unloadAudio = async () => {
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); } catch (e) {}
      try { await soundRef.current.unloadAsync(); } catch (e) {}
      soundRef.current = null;
    }
  };

  const togglePlayback = async () => {
    if (!soundRef.current) return;
    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        // If loop is active, ensure we start within bounds
        const loop = loopRef.current;
        if (loop.active && loop.a !== null && loop.b !== null) {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded && (status.positionMillis < loop.a || status.positionMillis >= loop.b)) {
            await soundRef.current.setPositionAsync(loop.a);
          }
        }
        await soundRef.current.playAsync();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const seekTo = async (positionMs) => {
    if (!soundRef.current) return;
    try {
      let clamped = positionMs;
      // Constrain to loop bounds when loop is active
      const loop = loopRef.current;
      if (loop.active && loop.a !== null && loop.b !== null) {
        clamped = Math.max(loop.a, Math.min(loop.b, clamped));
      }
      await soundRef.current.setPositionAsync(clamped);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const skipBackward = async () => {
    const loop = loopRef.current;
    const min = (loop.active && loop.a !== null) ? loop.a : 0;
    await seekTo(Math.max(min, position - 10000));
  };

  const skipForward = async () => {
    const loop = loopRef.current;
    const max = (loop.active && loop.b !== null) ? loop.b : duration;
    await seekTo(Math.min(max, position + 10000));
  };

  const handleSpeedChange = (newSpeed) => {
    setPlaybackSpeed(newSpeed);
    if (soundRef.current) {
      soundRef.current.setRateAsync(newSpeed, true).catch(() => {});
    }
  };

  const handleToggleLoop = () => {
    if (isLoopActive) {
      // Update ref immediately so callback sees it right away
      loopRef.current = { active: false, a: null, b: null };
      setLoopA(null);
      setLoopB(null);
      setIsLoopActive(false);
    } else if (duration > 0) {
      // Place markers around current position (±10s, clamped to track bounds)
      const span = Math.min(10000, duration * 0.25);
      const a = Math.max(0, position - span);
      const b = Math.min(duration, position + span);
      // Update ref immediately so callback sees it right away
      loopRef.current = { active: true, a, b };
      setLoopA(a);
      setLoopB(b);
      setIsLoopActive(true);
      // Seek to loop start if current position is outside the loop
      if (position < a || position > b) {
        soundRef.current?.setPositionAsync(a).catch(() => {});
      }
    }
  };

  const progress = duration > 0 ? position / duration : 0;

  const speedPresets = [0.25, 0.5, 0.75, 1.0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.loopToggle, isLoopActive && styles.loopToggleActive]}
          onPress={handleToggleLoop}
          disabled={duration <= 0}
        >
          <Text style={[styles.loopToggleText, isLoopActive && styles.loopToggleTextActive]}>
            Loop
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        {/* Album Art */}
        <View style={styles.albumArt}>
          <Text style={styles.albumArtText}>
            {(music?.name || 'M').charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.musicTitle} numberOfLines={2}>
          {music?.name || 'Unknown'}
        </Text>

        {/* Interactive Waveform */}
        <View style={styles.waveformSection}>
          <WaveformSeekBar
            progress={progress}
            duration={duration}
            onSeek={seekTo}
            loopA={loopA}
            loopB={loopB}
            isLoopActive={isLoopActive}
            theme={theme}
            onLoopAChange={(a) => { loopRef.current = { ...loopRef.current, a }; setLoopA(a); }}
            onLoopBChange={(b) => { loopRef.current = { ...loopRef.current, b }; setLoopB(b); }}
            onScrollEnabledChange={setScrollEnabled}
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatDuration(position)}</Text>
            <Text style={styles.timeText}>{formatDuration(duration)}</Text>
          </View>
        </View>

        {/* Playback Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={skipBackward}>
            <Text style={styles.controlButtonText}>-10</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={togglePlayback}
            disabled={isLoading}
          >
            {isPlaying ? (
              <View style={styles.pauseIcon}>
                <View style={styles.pauseBar} />
                <View style={styles.pauseBar} />
              </View>
            ) : (
              <View style={styles.playIcon} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={skipForward}>
            <Text style={styles.controlButtonText}>+10</Text>
          </TouchableOpacity>
        </View>

        {/* Speed Control */}
        <View style={styles.speedSection}>
          <Text style={styles.speedValue}>{playbackSpeed.toFixed(2)}x</Text>
          <SpeedSlider
            speed={playbackSpeed}
            onSpeedChange={handleSpeedChange}
            theme={theme}
            onScrollEnabledChange={setScrollEnabled}
          />
          <View style={styles.speedPresets}>
            {speedPresets.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.speedPreset, playbackSpeed === s && styles.speedPresetActive]}
                onPress={() => handleSpeedChange(s)}
              >
                <Text style={[
                  styles.speedPresetText,
                  playbackSpeed === s && styles.speedPresetTextActive,
                ]}>
                  {s === 1.0 ? '1x' : `${s}x`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 36,
    color: theme.colors.text,
    fontWeight: '300',
    marginTop: -4,
  },
  loopToggle: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loopToggleActive: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  loopToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  loopToggleTextActive: {
    color: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  albumArt: {
    width: 160,
    height: 160,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  albumArtText: {
    fontSize: 56,
    fontWeight: '200',
    color: theme.colors.textMuted,
  },
  musicTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  waveformSection: {
    width: '100%',
    marginBottom: 24,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginHorizontal: 20,
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginBottom: 24,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  playButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopWidth: 13,
    borderBottomWidth: 13,
    borderLeftWidth: 20,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: theme.colors.background,
    marginLeft: 4,
  },
  pauseIcon: {
    flexDirection: 'row',
    gap: 7,
  },
  pauseBar: {
    width: 7,
    height: 22,
    backgroundColor: theme.colors.background,
    borderRadius: 2,
  },
  speedSection: {
    marginTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  speedValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  speedPresets: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  speedPreset: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  speedPresetActive: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  speedPresetText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  speedPresetTextActive: {
    color: theme.colors.background,
  },
});

export default MusicPlayerScreen;
