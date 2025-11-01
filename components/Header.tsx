import React from 'react';
import Logo from './Logo';
import HamburgerMenu from './HamburgerMenu';

interface HeaderProps {
  onLogoClick?: () => void;
  hideMenu?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick, hideMenu = false }) => {
  return (
    <>
      <header className="w-full pt-4 md:pt-0 pb-4 md:pb-6 flex-shrink-0">
        <div className="flex items-center justify-center">
          <button
            onClick={onLogoClick}
            className="cursor-pointer hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:opacity-80"
            aria-label="Go to home"
          >
            <Logo className="h-8 md:h-10 w-auto" />
          </button>
        </div>
      </header>
      {!hideMenu && <HamburgerMenu />}
    </>
  );
};

export default Header;
