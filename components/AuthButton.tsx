/**
 * Authentication Button Component
 * Displays sign-in/sign-out button with user info
 */

import React, { useState } from 'react';
import { SignIn, SignOut, User } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

export const AuthButton: React.FC = () => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
      alert('Failed to sign in. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
      alert('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
        <div className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
        <span className="text-sm text-white/60">Loading...</span>
      </div>
    );
  }

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-red-400"
      >
        <SignOut className="w-4 h-4" />
        <span className="text-sm">
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isSigningIn}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
    >
      <SignIn className="w-4 h-4" />
      <span className="text-sm font-medium">
        {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
      </span>
    </button>
  );
};
