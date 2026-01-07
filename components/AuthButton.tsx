/**
 * Authentication Button Component
 * Displays sign-in button that opens the auth modal
 */

import React, { useState } from 'react';
import { SignIn } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

export const AuthButton: React.FC = () => {
  const { user, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
        <div className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  // Don't show button if user is logged in (ProfileDropdown handles that)
  if (user) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsAuthModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border border-white/20 transition-all shadow-lg hover:shadow-xl"
      >
        <SignIn className="w-4 h-4" />
        <span className="text-sm font-medium">Sign In</span>
      </button>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
};
