import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Check if Supabase is configured
export function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseAnonKey && supabase);
}

// Initialize anonymous session (Supabase handles this automatically with anon key)
export async function initializeSupabase() {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured - missing URL or anon key');
    return false;
  }

  try {
    // Test the connection by checking storage
    const { error } = await supabase.storage.getBucket('tabs');
    if (error && error.message !== 'Bucket not found') {
      console.error('Supabase connection error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Supabase initialization error:', error);
    return false;
  }
}
