import React from 'react';
import Logo from './Logo';

const Header: React.FC = () => {
  return (
    <header className="w-full pt-6">
      <div className="flex items-center justify-center">
        <Logo className="h-12 w-auto" />
      </div>
    </header>
  );
};

export default Header;
