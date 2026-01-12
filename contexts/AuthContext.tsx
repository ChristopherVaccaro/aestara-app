/**
 * Authentication Context
 * Manages user authentication state with Supabase Auth
 * 
 * StrictMode-safe: subscription is created on every mount and cleaned up on unmount.
 * Supabase handles OAuth tokens via detectSessionInUrl: true in client config.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';
import { trackAuthListener, isDebugMode } from '../utils/supabaseDebug';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Guard to prevent duplicate subscription setup in StrictMode
  const subscriptionSetupRef = useRef(false);

  useEffect(() => {
    // Flag to prevent state updates after unmount
    let isMounted = true;

    if (isDebugMode()) {
      console.log('🔐 Auth: Setting up subscription...');
    }
    
    // Track auth listener for debugging
    trackAuthListener('add');

    // 1. Subscribe to auth state changes FIRST (before getSession)
    //    This ensures we don't miss any events that fire during initialization
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!isMounted) return;

      if (isDebugMode()) {
        console.log('🔄 Auth state changed:', event, currentSession?.user?.email ?? 'no user');
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      // Clean up URL hash after successful sign-in (OAuth redirect)
      if (event === 'SIGNED_IN' && window.location.hash) {
        if (isDebugMode()) {
          console.log('🧹 Cleaning up URL hash after sign-in');
        }
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    // 2. Get initial session (Supabase auto-handles OAuth tokens via detectSessionInUrl)
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!isMounted) return;

      if (error) {
        console.error('❌ Error getting initial session:', error);
      } else {
        if (isDebugMode()) {
          console.log('✅ Initial session:', initialSession?.user?.email ?? 'none');
        }
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      }
      setLoading(false);

      // Clean up any lingering hash (e.g., OAuth tokens already processed)
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    // Cleanup: unsubscribe and prevent stale updates
    return () => {
      if (isDebugMode()) {
        console.log('🔐 Auth: Cleaning up subscription');
      }
      isMounted = false;
      trackAuthListener('remove');
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    // Get the current origin (works for both localhost and production)
    const redirectUrl = window.location.origin;
    
    console.log('🚀 Initiating Google sign-in...');
    console.log('Redirect URL:', redirectUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        // Skip confirmation for faster sign-in
        skipBrowserRedirect: false,
      },
    });
    
    if (error) {
      console.error('❌ Error signing in with Google:', error);
      throw error;
    }
    
    console.log('✅ OAuth redirect initiated');
    console.log('Provider:', data.provider);
    console.log('URL:', data.url);
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ error: string | null }> => {
    console.log('🔐 Signing in with email:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Error signing in with email:', error);
      return { error: error.message };
    }
    
    console.log('✅ Signed in successfully:', data.user?.email);
    return { error: null };
  };

  const signUpWithEmail = async (email: string, password: string, name?: string): Promise<{ error: string | null }> => {
    console.log('📝 Signing up with email:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || email.split('@')[0],
        },
      },
    });
    
    if (error) {
      console.error('❌ Error signing up:', error);
      return { error: error.message };
    }
    
    // Check if email confirmation is required
    if (data.user && !data.session) {
      console.log('📧 Confirmation email sent');
      return { error: 'Please check your email to confirm your account.' };
    }
    
    console.log('✅ Signed up successfully:', data.user?.email);
    return { error: null };
  };

  const signOut = useCallback(async () => {
    console.log('🚪 Signing out...');
    
    // Optimistically clear UI state immediately for instant feedback
    setSession(null);
    setUser(null);
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Error signing out:', error);
      // Note: UI already cleared; onAuthStateChange will handle if session persists
      throw error;
    }
    
    console.log('✅ Signed out successfully');
  }, []);

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
