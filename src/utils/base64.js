/**
 * Base64 encoding/decoding utilities for React Native
 *
 * React Native doesn't have native atob/btoa support, so we implement
 * a custom base64 decoder for Supabase storage operations.
 */

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP = new Uint8Array(256);

// Initialize lookup table
for (let i = 0; i < BASE64_CHARS.length; i++) {
  BASE64_LOOKUP[BASE64_CHARS.charCodeAt(i)] = i;
}

/**
 * Convert base64 string to Uint8Array bytes
 *
 * @param {string} base64 - Base64 encoded string
 * @returns {Uint8Array} Decoded bytes
 */
export function base64ToBytes(base64) {
  // Remove padding and whitespace
  let str = base64.replace(/[\s=]/g, '');
  const len = str.length;
  const bytes = new Uint8Array(Math.floor(len * 3 / 4));

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const a = BASE64_LOOKUP[str.charCodeAt(i)];
    const b = BASE64_LOOKUP[str.charCodeAt(i + 1)];
    const c = BASE64_LOOKUP[str.charCodeAt(i + 2)];
    const d = BASE64_LOOKUP[str.charCodeAt(i + 3)];

    bytes[p++] = (a << 2) | (b >> 4);
    if (i + 2 < len) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (i + 3 < len) bytes[p++] = ((c & 3) << 6) | d;
  }

  return bytes.subarray(0, p);
}
