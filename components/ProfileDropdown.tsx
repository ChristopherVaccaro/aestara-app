import React, { useState, useRef, useEffect } from 'react';
import { User, SignOut, CaretDown, ImageSquare, Question } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileDropdownProps {
  onOpenProfile: () => void;
  onOpenGallery?: () => void;
  onOpenFAQ?: () => void;
  onOpenHistory?: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ 
  onOpenProfile, 
  onOpenGallery,
  onOpenFAQ,
  onOpenHistory 
}) => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!user) return null;

  // Get initials for avatar
  const getInitials = (email: string) => {
    const name = email.split('@')[0];
    return name
      .split(/[._-]/)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar background based on email hash
  const getAvatarBg = () => {
    const colors = [
      'bg-gradient-to-br from-violet-500 to-rose-500',
      'bg-gradient-to-br from-blue-500 to-cyan-500',
      'bg-gradient-to-br from-emerald-500 to-teal-500',
      'bg-gradient-to-br from-orange-500 to-amber-500',
      'bg-gradient-to-br from-pink-500 to-purple-500',
    ];
    const hash = (user.email || '').split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const displayEmail = user.email || '';

  return (
    <div ref={dropdownRef} className="relative">
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors"
      >
        <div className={`w-9 h-9 ${getAvatarBg()} rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md`}>
          {user.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt={displayName} 
              className="w-full h-full rounded-full object-cover" 
            />
          ) : (
            getInitials(displayEmail)
          )}
        </div>
        <CaretDown 
          size={16} 
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 overflow-hidden z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 bg-slate-900/50 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${getAvatarBg()} rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md`}>
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt={displayName} 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  getInitials(displayEmail)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenProfile();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-300 hover:bg-white/10 transition-colors"
            >
              <User size={18} className="text-slate-400" />
              <span className="font-medium">Profile</span>
            </button>
            
            {onOpenGallery && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenGallery();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-300 hover:bg-white/10 transition-colors"
              >
                <ImageSquare size={18} className="text-slate-400" />
                <span className="font-medium">History</span>
              </button>
            )}
            
            {onOpenFAQ && (
              <>
                <div className="my-1 border-t border-white/10" />
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenFAQ();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-300 hover:bg-white/10 transition-colors"
                >
                  <Question size={18} className="text-slate-400" />
                  <span className="font-medium">Help & FAQ</span>
                </button>
              </>
            )}
            
            <div className="my-1 border-t border-white/10" />
            
            <button
              onClick={async () => {
                setIsOpen(false);
                await signOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <SignOut size={18} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
