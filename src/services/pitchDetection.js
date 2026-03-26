/**
 * Pitch detection using Autocorrelation algorithm
 * This is the most reliable method for detecting musical instrument pitches
 */

const MIN_FREQUENCY = 30;  // Lowest frequency to detect (below bass E1)
const MAX_FREQUENCY = 1000; // Highest frequency to detect

/**
 * Autocorrelation-based pitch detection
 * @param {Float32Array} buffer - Audio sample buffer
 * @param {number} sampleRate - Sample rate of the audio
 * @returns {number|null} - Detected frequency in Hz, or null if no pitch detected
 */
export function detectPitch(buffer, sampleRate) {
  // Check if there's enough signal (not silence)
  const rms = calculateRMS(buffer);
  if (rms < 0.01) {
    return null; // Signal too quiet
  }

  // Calculate autocorrelation
  const minPeriod = Math.floor(sampleRate / MAX_FREQUENCY);
  const maxPeriod = Math.floor(sampleRate / MIN_FREQUENCY);
  const bufferLength = buffer.length;

  // Ensure we have enough samples
  if (maxPeriod >= bufferLength / 2) {
    return null;
  }

  // Normalized Square Difference Function (NSDF)
  const nsdf = new Float32Array(maxPeriod);

  for (let tau = minPeriod; tau < maxPeriod; tau++) {
    let acf = 0; // Autocorrelation
    let divisorA = 0;
    let divisorB = 0;

    for (let i = 0; i < bufferLength - tau; i++) {
      acf += buffer[i] * buffer[i + tau];
      divisorA += buffer[i] * buffer[i];
      divisorB += buffer[i + tau] * buffer[i + tau];
    }

    // NSDF formula
    nsdf[tau] = 2 * acf / (divisorA + divisorB + 0.0001);
  }

  // Find peaks in NSDF
  const peaks = findPeaks(nsdf, minPeriod, maxPeriod);

  if (peaks.length === 0) {
    return null;
  }

  // Find the highest peak above threshold
  const threshold = 0.5;
  let bestPeak = null;

  for (const peak of peaks) {
    if (nsdf[peak] > threshold) {
      if (!bestPeak || nsdf[peak] > nsdf[bestPeak]) {
        bestPeak = peak;
      }
      // Prefer the first peak above threshold (fundamental frequency)
      break;
    }
  }

  if (!bestPeak) {
    return null;
  }

  // Parabolic interpolation for better precision
  const refinedPeriod = parabolicInterpolation(nsdf, bestPeak);
  const frequency = sampleRate / refinedPeriod;

  // Validate frequency range
  if (frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) {
    return null;
  }

  return frequency;
}

/**
 * Calculate Root Mean Square of the signal
 */
function calculateRMS(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

/**
 * Find peaks in the NSDF
 */
function findPeaks(nsdf, minPeriod, maxPeriod) {
  const peaks = [];
  let positive = false;

  for (let i = minPeriod; i < maxPeriod - 1; i++) {
    if (nsdf[i] > 0 && !positive) {
      positive = true;
    }

    if (positive && nsdf[i] > nsdf[i - 1] && nsdf[i] >= nsdf[i + 1]) {
      peaks.push(i);
    }

    if (nsdf[i] < 0) {
      positive = false;
    }
  }

  return peaks;
}

/**
 * Parabolic interpolation for sub-sample precision
 */
function parabolicInterpolation(array, index) {
  if (index <= 0 || index >= array.length - 1) {
    return index;
  }

  const alpha = array[index - 1];
  const beta = array[index];
  const gamma = array[index + 1];

  const peak = 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma + 0.0001);

  return index + peak;
}

/**
 * Simple YIN algorithm implementation for comparison
 * Can be used as fallback or validation
 */
export function detectPitchYIN(buffer, sampleRate) {
  const threshold = 0.1;
  const bufferSize = buffer.length;
  const halfBuffer = Math.floor(bufferSize / 2);

  // Difference function
  const difference = new Float32Array(halfBuffer);

  for (let tau = 0; tau < halfBuffer; tau++) {
    let sum = 0;
    for (let i = 0; i < halfBuffer; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    difference[tau] = sum;
  }

  // Cumulative mean normalized difference
  const cmndf = new Float32Array(halfBuffer);
  cmndf[0] = 1;

  let runningSum = 0;
  for (let tau = 1; tau < halfBuffer; tau++) {
    runningSum += difference[tau];
    cmndf[tau] = difference[tau] / (runningSum / tau + 0.0001);
  }

  // Find first minimum below threshold
  let tau = 2;
  while (tau < halfBuffer) {
    if (cmndf[tau] < threshold) {
      while (tau + 1 < halfBuffer && cmndf[tau + 1] < cmndf[tau]) {
        tau++;
      }
      const refinedTau = parabolicInterpolation(cmndf, tau);
      return sampleRate / refinedTau;
    }
    tau++;
  }

  return null;
}
