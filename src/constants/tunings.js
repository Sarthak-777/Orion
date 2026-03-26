// Standard tuning frequencies for different instruments
// A4 = 440Hz as reference

export const INSTRUMENTS = [
  { id: 'guitar', name: 'Guitar', icon: '🎸', strings: 6 },
  { id: 'ukulele', name: 'Ukulele', icon: '🪕', strings: 4 },
  { id: 'bass', name: 'Bass', icon: '🎸', strings: 4 },
];

export const TUNINGS = {
  guitar: [
    {
      id: 'standard',
      name: 'Standard',
      notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
      frequencies: [82.41, 110.00, 146.83, 196.00, 246.94, 329.63]
    },
    {
      id: 'dropD',
      name: 'Drop D',
      notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
      frequencies: [73.42, 110.00, 146.83, 196.00, 246.94, 329.63]
    },
    {
      id: 'halfStepDown',
      name: 'Half Step Down',
      notes: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'],
      frequencies: [77.78, 103.83, 138.59, 185.00, 233.08, 311.13]
    },
    {
      id: 'openG',
      name: 'Open G',
      notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'],
      frequencies: [73.42, 98.00, 146.83, 196.00, 246.94, 293.66]
    },
    {
      id: 'dadgad',
      name: 'DADGAD',
      notes: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'],
      frequencies: [73.42, 110.00, 146.83, 196.00, 220.00, 293.66]
    },
  ],
  ukulele: [
    {
      id: 'standard',
      name: 'Standard (GCEA)',
      notes: ['G4', 'C4', 'E4', 'A4'],
      frequencies: [392.00, 261.63, 329.63, 440.00]
    },
    {
      id: 'lowG',
      name: 'Low G',
      notes: ['G3', 'C4', 'E4', 'A4'],
      frequencies: [196.00, 261.63, 329.63, 440.00]
    },
    {
      id: 'baritone',
      name: 'Baritone (DGBE)',
      notes: ['D3', 'G3', 'B3', 'E4'],
      frequencies: [146.83, 196.00, 246.94, 329.63]
    },
  ],
  bass: [
    {
      id: 'standard',
      name: 'Standard',
      notes: ['E1', 'A1', 'D2', 'G2'],
      frequencies: [41.20, 55.00, 73.42, 98.00]
    },
    {
      id: 'dropD',
      name: 'Drop D',
      notes: ['D1', 'A1', 'D2', 'G2'],
      frequencies: [36.71, 55.00, 73.42, 98.00]
    },
    {
      id: 'halfStepDown',
      name: 'Half Step Down',
      notes: ['Eb1', 'Ab1', 'Db2', 'Gb2'],
      frequencies: [38.89, 51.91, 69.30, 92.50]
    },
  ],
};

// Note frequencies for all notes (for pitch detection)
export const NOTE_FREQUENCIES = {
  'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83,
  'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
  'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65,
  'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31,
  'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
  'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
  'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
  'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
};

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
