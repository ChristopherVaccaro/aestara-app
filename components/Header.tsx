import React from 'react';
import Logo from './Logo';

const Header: React.FC = () => {
  return (
    <header className="w-full py-6">
      <div className="flex items-center gap-4">
        <Logo className="h-12 w-12 md:h-14 md:w-14" />
        <div className="flex flex-col">
          <h1 className="relative text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            {/* Glow layer */}
            <span
              className="absolute inset-0 blur-md opacity-30 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-500 select-none pointer-events-none"
              aria-hidden
            >
              AI Image Stylizer
            </span>
            {/* Main gradient text */}
            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-500 to-pink-500">
              AI Image Stylizer
            </span>
          </h1>
          <div className="mt-2 h-1 w-36 rounded-full bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-500" />
          <p className="text-lg text-gray-300 mt-2">
            Transform your photos with the power of AI.
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
