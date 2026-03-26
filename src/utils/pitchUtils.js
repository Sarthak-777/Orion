import { NOTE_NAMES } from '../constants/tunings';

const A4_FREQUENCY = 440;
const A4_MIDI_NUMBER = 69;

/**
 * Convert frequency to the nearest note name
 * @param {number} frequency - Frequency in Hz
 * @returns {object} - { note, octave, frequency, cents }
 */
export function frequencyToNote(frequency) {
  if (!frequency || frequency < 20 || frequency > 5000) {
    return null;
  }

  // Calculate the number of semitones from A4
  const semitones = 12 * Math.log2(frequency / A4_FREQUENCY);
  const midiNumber = Math.round(A4_MIDI_NUMBER + semitones);

  // Get note name and octave
  const noteIndex = ((midiNumber % 12) + 12) % 12;
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteName = NOTE_NAMES[noteIndex];

  // Calculate the exact frequency of the nearest note
  const exactFrequency = A4_FREQUENCY * Math.pow(2, (midiNumber - A4_MIDI_NUMBER) / 12);

  // Calculate cents deviation (100 cents = 1 semitone)
  const cents = 1200 * Math.log2(frequency / exactFrequency);

  return {
    note: noteName,
    octave,
    fullNote: `${noteName}${octave}`,
    exactFrequency,
    detectedFrequency: frequency,
    cents: Math.round(cents),
  };
}

/**
 * Calculate how far the detected frequency is from the target
 * @param {number} detectedFreq - Detected frequency
 * @param {number} targetFreq - Target frequency
 * @returns {number} - Cents deviation (-50 to +50 is generally in tune)
 */
export function calculateCentsDeviation(detectedFreq, targetFreq) {
  if (!detectedFreq || !targetFreq) return 0;
  return Math.round(1200 * Math.log2(detectedFreq / targetFreq));
}

/**
 * Determine if the note is in tune
 * @param {number} cents - Cents deviation
 * @param {number} threshold - Threshold for being "in tune" (default 5 cents)
 * @returns {string} - 'in_tune', 'flat', 'sharp'
 */
export function getTuningStatus(cents, threshold = 5) {
  if (Math.abs(cents) <= threshold) {
    return 'in_tune';
  }
  return cents < 0 ? 'flat' : 'sharp';
}

/**
 * Find the closest string to a detected frequency
 * @param {number} frequency - Detected frequency
 * @param {number[]} targetFrequencies - Array of target frequencies for strings
 * @returns {object} - { stringIndex, cents, status }
 */
export function findClosestString(frequency, targetFrequencies) {
  if (!frequency || !targetFrequencies?.length) return null;

  let closestIndex = 0;
  let minCents = Infinity;

  targetFrequencies.forEach((targetFreq, index) => {
    const cents = Math.abs(calculateCentsDeviation(frequency, targetFreq));
    if (cents < minCents) {
      minCents = cents;
      closestIndex = index;
    }
  });

  const cents = calculateCentsDeviation(frequency, targetFrequencies[closestIndex]);

  return {
    stringIndex: closestIndex,
    cents,
    status: getTuningStatus(cents),
    targetFrequency: targetFrequencies[closestIndex],
  };
}

/**
 * Convert note name to frequency
 * @param {string} note - Note name (e.g., 'A4', 'E2')
 * @returns {number} - Frequency in Hz
 */
export function noteToFrequency(note) {
  const match = note.match(/^([A-G]#?)(\d+)$/);
  if (!match) return null;

  const [, noteName, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);
  const noteIndex = NOTE_NAMES.indexOf(noteName);

  if (noteIndex === -1) return null;

  const midiNumber = (octave + 1) * 12 + noteIndex;
  return A4_FREQUENCY * Math.pow(2, (midiNumber - A4_MIDI_NUMBER) / 12);
}
