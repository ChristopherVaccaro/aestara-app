import React from 'react';

interface DevModeToggleProps {
  isDevMode: boolean;
  onToggle: (enabled: boolean) => void;
  useProModel?: boolean;
  onProModelToggle?: (enabled: boolean) => void;
}

const DevModeToggle: React.FC<DevModeToggleProps> = ({ isDevMode, onToggle, useProModel, onProModelToggle }) => {
  // Only show in development environment (check if running on localhost)
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (!isDevelopment) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="glass-panel p-3 flex flex-col gap-2 shadow-xl">
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
        </div>
        {onProModelToggle && (
          <div className="flex items-center justify-between gap-2 text-xs text-gray-200">
            <span className="font-mono">Nano Banana Pro</span>
            <label
              className={`relative inline-flex items-center ${!isDevMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input
                type="checkbox"
                checked={!!useProModel}
                onChange={(e) => onProModelToggle(e.target.checked)}
                disabled={!isDevMode}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-700/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500/50"></div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevModeToggle;
