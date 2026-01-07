/**
 * Authentication Context
 * Manages user authentication state with Supabase Auth
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';

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

  useEffect(() => {
    // Handle OAuth callback on page load
    const handleAuthCallback = async () => {
      try {
        console.log('🔐 Auth initialization starting...');
        console.log('Current URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        
        // Check if we have auth tokens in the URL (from OAuth redirect)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        console.log('Access token in URL:', accessToken ? 'YES' : 'NO');
        console.log('Refresh token in URL:', refreshToken ? 'YES' : 'NO');
        
        if (accessToken) {
          console.log('✅ OAuth callback detected! Processing tokens...');
          
          // Let Supabase handle the tokens from the URL
          // It will automatically parse and store them
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for Supabase to process
          
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ Error getting session after OAuth:', error);
          } else if (session) {
            console.log('✅ Session established successfully!');
            console.log('User email:', session.user.email);
            console.log('User ID:', session.user.id);
            setSession(session);
            setUser(session.user);
            
            // Clean up URL by removing hash
            console.log('🧹 Cleaning up URL hash...');
            window.history.replaceState(null, '', window.location.pathname);
          } else {
            console.warn('⚠️ Tokens present but no session created');
          }
        } else {
          console.log('ℹ️ No OAuth tokens in URL, checking for existing session...');
          // No OAuth callback, just get existing session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ Error getting existing session:', error);
          } else if (session) {
            console.log('✅ Existing session found:', session.user.email);
          } else {
            console.log('ℹ️ No existing session');
          }
          
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('❌ Error in auth callback handler:', error);
      } finally {
        console.log('🏁 Auth initialization complete');
        setLoading(false);
      }
    };

    handleAuthCallback();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event);
      if (session?.user) {
        console.log('👤 User:', session.user.email);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // If signed in, clean up URL
      if (event === 'SIGNED_IN' && window.location.hash) {
        console.log('🧹 Cleaning up URL after sign-in...');
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
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

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

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
