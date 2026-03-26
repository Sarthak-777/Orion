const fs = require('fs');
const path = require('path');

function generateClickWav(frequency, durationMs, volume) {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * durationMs / 1000);
  const dataSize = numSamples * 2; // 16-bit = 2 bytes per sample
  const buffer = Buffer.alloc(44 + dataSize);

  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(1, 22);  // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32);  // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // PCM samples: sine wave with exponential decay
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const decay = Math.exp(-t * 300);
    const sample = Math.sin(2 * Math.PI * frequency * t) * volume * decay;
    const clamped = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  return buffer;
}

const outputDir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(outputDir, { recursive: true });

// Regular click: 1000Hz, 20ms, 0.8 volume
const click = generateClickWav(1000, 20, 0.8);
fs.writeFileSync(path.join(outputDir, 'click.wav'), click);

// Accent click: 1500Hz, 20ms, 1.0 volume
const accent = generateClickWav(1500, 20, 1.0);
fs.writeFileSync(path.join(outputDir, 'accent.wav'), accent);

console.log('Generated click.wav and accent.wav in assets/sounds/');
