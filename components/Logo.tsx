import React from 'react';

const Logo: React.FC<{ className?: string }>= ({ className = 'h-12 w-12' }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="AI Image Stylizer logo"
    >
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Friendly rounded square */}
      <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#grad)" />
      {/* Camera lens circle */}
      <circle cx="32" cy="32" r="12" fill="#111827" opacity="0.9" />
      <circle cx="32" cy="32" r="8" fill="#1f2937" />
      <circle cx="30" cy="28" r="3" fill="url(#shine)" />
      {/* Sparkles to suggest AI magic */}
      <g fill="#fff" opacity="0.9">
        <path d="M48 18l1.5 3.5L53 23l-3.5 1.5L48 28l-1.5-3.5L43 23l3.5-1.5L48 18z" />
        <path d="M16 42l1 2.4L19.5 45l-2.5 1L16 48l-1-2.5L12.5 45l2.5-.6L16 42z" opacity="0.85" />
      </g>
      {/* Subtle highlight */}
      <path d="M10 16c10-6 34-6 44 0" stroke="#fff" strokeOpacity="0.15" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};

export default Logo;
