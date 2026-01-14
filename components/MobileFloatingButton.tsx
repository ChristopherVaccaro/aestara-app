import React from 'react';
import { useUserSettings } from '../contexts/UserSettingsContext';

interface MobileFloatingButtonProps {
  onClick: () => void;
}

const MobileFloatingButton: React.FC<MobileFloatingButtonProps> = ({ onClick }) => {
  const { fabPosition } = useUserSettings();
  
  // Position classes based on user preference
  // Raised ~25% higher: changed from bottom-6 to bottom-[20%]
  const positionClasses = fabPosition === 'left' 
    ? 'left-6' 
    : 'right-6';

  return (
    <div className={`fixed bottom-[20%] ${positionClasses} z-40 lg:hidden`}>
      {/* Pulse animation ring - behind button */}
      <span className="absolute inset-0 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-subtle-pulse" />
      
      {/* Main button - iOS style - LARGER */}
      <button
        onClick={onClick}
        className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all duration-150"
        aria-label="Open styles menu"
        style={{
          boxShadow: '0 4px 16px rgba(168, 85, 247, 0.4)',
        }}
      >
        <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </button>
    </div>
  );
};

export default MobileFloatingButton;
