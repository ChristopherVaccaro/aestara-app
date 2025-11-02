import React from 'react';
import Logo from './Logo';
import HamburgerMenu from './HamburgerMenu';
import UserAvatar from './UserAvatar';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onLogoClick?: () => void;
  hideMenu?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick, hideMenu = false }) => {
  const { user } = useAuth();

  return (
    <>
      <header className="w-full pt-4 md:pt-0 pb-4 md:pb-6 flex-shrink-0">
        <div className="flex items-center justify-between px-4 md:px-6">
          {/* Left spacer for balance */}
          <div className="w-10 md:w-12" />
          
          {/* Center logo */}
          <button
            onClick={onLogoClick}
            className="cursor-pointer hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:opacity-80"
            aria-label="Go to home"
          >
            <Logo className="h-8 md:h-10 w-auto" />
          </button>
          
          {/* Right side - User avatar or spacer */}
          <div className="w-10 md:w-12 flex items-center justify-end">
            {user && <UserAvatar email={user.email || ''} size="md" />}
          </div>
        </div>
      </header>
      {!hideMenu && <HamburgerMenu />}
    </>
  );
};

export default Header;
