import React, { useEffect, useRef, useState } from 'react';
import Logo from './Logo';
import HamburgerMenu from './HamburgerMenu';
import UserAvatar from './UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import ProfilePage from './ProfilePage';
import { User, SignOut } from '@phosphor-icons/react';

interface HeaderProps {
  onLogoClick?: () => void;
  hideMenu?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick, hideMenu = false }) => {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  return (
    <>
      <header className="w-full pt-4 md:pt-0 pb-4 md:pb-6 flex-shrink-0">
        <div className="flex items-center justify-between px-4 md:px-6">
          {/* Left spacer - matches right side width for true centering */}
          <div className="w-20 md:w-24 flex-shrink-0" />
          
          {/* Center logo */}
          <button
            onClick={onLogoClick}
            className="cursor-pointer hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:opacity-80"
            aria-label="Go to home"
          >
            <Logo className="h-8 md:h-10 w-auto" />
          </button>
          
          {/* Right side - User avatar with tooltip menu (same width as left spacer) */}
          <div className="w-20 md:w-24 flex-shrink-0 flex items-center justify-end relative">
            {user && (
              <>
                <div onClick={() => setMenuOpen((v) => !v)}>
                  <UserAvatar email={user.email || ''} size="md" />
                </div>
                {menuOpen && (
                  <div ref={menuRef} className="absolute top-12 right-0 min-w-[180px] rounded-xl bg-gray-900/95 border border-white/10 shadow-xl backdrop-blur-xl z-50">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-white/10 rounded-t-xl"
                      onClick={() => { setShowProfile(true); setMenuOpen(false); }}
                    >
                      <User className="w-5 h-5" />
                      <span>Profile</span>
                    </button>
                    <div className="h-px bg-white/10" />
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-white/10 rounded-b-xl"
                      onClick={async () => { setMenuOpen(false); await signOut(); }}
                    >
                      <SignOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>
      {!hideMenu && <HamburgerMenu />}
      {showProfile && <ProfilePage onClose={() => setShowProfile(false)} />}
    </>
  );
};

export default Header;
