import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../config/supabase';

const AUTH_STORAGE_KEY = '@auth_user';

const AuthContext = createContext(null);

/**
 * AuthProvider - Manages user authentication state
 *
 * This context is set up for future social features including:
 * - User registration and login
 * - Profile management
 * - Sharing voice memos publicly
 * - Following other users
 * - Likes and comments on voice memos
 *
 * Currently, the app works without authentication.
 * When auth is implemented, users will be able to:
 * 1. Create an account with email/password or OAuth
 * 2. Share their voice memos publicly
 * 3. Browse and interact with other users' public memos
 * 4. Build a following and get notifications
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load persisted auth state on mount
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      // Check for stored user data
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }

      // If Supabase is configured, check for active session
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata?.username || null,
            avatar: session.user.user_metadata?.avatar_url || null,
            createdAt: session.user.created_at,
          };
          setUser(userData);
          setIsAuthenticated(true);
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = useCallback(async (email, password, username) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Authentication not configured' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          username,
          avatar: null,
          createdAt: data.user.created_at,
        };
        setUser(userData);
        setIsAuthenticated(true);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        return { success: true, user: userData };
      }

      return { success: false, error: 'Failed to create account' };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Authentication not configured' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username || null,
          avatar: data.user.user_metadata?.avatar_url || null,
          createdAt: data.user.created_at,
        };
        setUser(userData);
        setIsAuthenticated(true);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        return { success: true, user: userData };
      }

      return { success: false, error: 'Failed to sign in' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }

      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates) => {
    if (!isSupabaseConfigured() || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) throw error;

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  // Listen for auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata?.username || null,
            avatar: session.user.user_metadata?.avatar_url || null,
            createdAt: session.user.created_at,
          };
          setUser(userData);
          setIsAuthenticated(true);
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    // State
    user,
    isLoading,
    isAuthenticated,

    // Actions
    signUp,
    signIn,
    signOut,
    updateProfile,

    // Helpers
    isSupabaseConfigured: isSupabaseConfigured(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
