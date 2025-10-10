import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative inline-flex ${className}`}>
      <span
        className="absolute -inset-2 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 blur-xl"
        aria-hidden
      />
      <span className="relative text-2xl md:text-3xl font-thin tracking-[0.25em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-cyan-200 drop-shadow-[0_2px_8px_rgba(168,85,247,0.4)]" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>
        Aestara
      </span>
    </div>
  );
};

export default Logo;
