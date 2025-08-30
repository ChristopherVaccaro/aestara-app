import React from 'react';

const Logo: React.FC<{ className?: string }>= ({ className = 'h-12 w-auto' }) => {
  return (
    <div className={`${className} flex items-center`}>
      <div className="text-logo relative">
        {/* Glow layer */}
        <span
          className="absolute inset-0 blur-sm opacity-40 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-500 select-none pointer-events-none font-black text-2xl md:text-3xl tracking-tight"
          aria-hidden
        >
          AI
        </span>
        {/* Main gradient text */}
        <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-400 to-pink-400 font-black text-2xl md:text-3xl tracking-tight">
          AI
        </span>
      </div>
      <div className="ml-1 text-logo-secondary relative">
        {/* Glow layer */}
        <span
          className="absolute inset-0 blur-sm opacity-30 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 select-none pointer-events-none font-bold text-lg md:text-xl tracking-wide"
          aria-hidden
        >
          Stylizer
        </span>
        {/* Main gradient text */}
        <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300 font-bold text-lg md:text-xl tracking-wide">
          Stylizer
        </span>
      </div>
    </div>
  );
};

export default Logo;
