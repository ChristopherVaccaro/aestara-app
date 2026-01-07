import React, { useState } from 'react';
import Logo from './Logo';
import ProfileDropdown from './ProfileDropdown';
import { AuthButton } from './AuthButton';
import { useAuth } from '../contexts/AuthContext';
import ProfilePage from './ProfilePage';
import { ArrowLeft } from '@phosphor-icons/react';

interface HeaderProps {
  onLogoClick?: () => void;
  hideMenu?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onOpenGallery?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick, hideMenu = false, showBackButton = false, onBackClick, onOpenGallery }) => {
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <header className="w-full flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Back button or spacer (fixed width for centering) */}
            <div className="w-24 flex-shrink-0 flex items-center">
              {showBackButton && onBackClick ? (
                <button
                  onClick={onBackClick}
                  className="p-2 hover:opacity-70 transition-opacity duration-200 text-gray-400 hover:text-white"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-6 h-6 md:w-7 md:h-7" />
                </button>
              ) : null}
            </div>
            
            {/* Center logo - flex-1 to take remaining space, centered content */}
            <div className="flex-1 flex justify-center">
              <button
                onClick={onLogoClick}
                className="cursor-pointer hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:opacity-80"
                aria-label="Go to home"
              >
                <Logo className="h-8 md:h-10 w-auto" />
              </button>
            </div>
            
            {/* Right side - Auth button or Profile dropdown (fixed width for centering) */}
            <div className="w-24 flex-shrink-0 flex items-center justify-end">
              {user ? (
                <ProfileDropdown
                  onOpenProfile={() => setShowProfile(true)}
                  onOpenGallery={onOpenGallery}
                />
              ) : (
                <AuthButton />
              )}
            </div>
          </div>
        </div>
      </header>
      {showProfile && <ProfilePage onClose={() => setShowProfile(false)} />}
    </>
  );
};

export default Header;
