import React from 'react';

interface DevModeToggleProps {
  isDevMode: boolean;
  onToggle: (enabled: boolean) => void;
}

const DevModeToggle: React.FC<DevModeToggleProps> = ({ isDevMode, onToggle }) => {
  // Only show in development environment (check if running on localhost)
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (!isDevelopment) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="glass-panel p-3 flex items-center gap-3 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-yellow-300">DEV</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isDevMode}
              onChange={(e) => onToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500/50"></div>
          </label>
          <span className="text-xs text-gray-300">Mock Mode</span>
        </div>
        {isDevMode && (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-lg">
            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold text-yellow-300">Active</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevModeToggle;
