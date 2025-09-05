import React from 'react';
import Logo from './Logo';

const Header: React.FC = () => {
  return (
    <header className="w-full py-6">
      <div className="flex items-center gap-4">
        <Logo className="h-12 w-auto" />
        <div className="flex flex-col">
          <div className="mt-2 h-1 w-36 rounded-full bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-500" />
        </div>
      </div>
    </header>
  );
};

export default Header;
