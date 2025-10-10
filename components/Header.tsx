import React from 'react';
import Logo from './Logo';

interface HeaderProps {
  onLogoClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <header className="w-full pt-6">
      <div className="flex items-center justify-center">
        <button
          onClick={onLogoClick}
          className="cursor-pointer hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:opacity-80"
          aria-label="Go to home"
        >
          <Logo className="h-12 w-auto" />
        </button>
      </div>
    </header>
  );
};

export default Header;
