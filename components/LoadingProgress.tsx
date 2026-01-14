import React, { useEffect, useState } from 'react';

interface LoadingProgressProps {
  message?: string;
  estimatedTimeMs?: number;
}

const LoadingProgress: React.FC<LoadingProgressProps> = ({
  message = 'Applying style...',
  estimatedTimeMs = 10000,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);

  const tips = [
    'AI is analyzing your image...',
    'Applying artistic transformations...',
    'Rendering final details...',
    'Almost ready!',
  ];

  useEffect(() => {
    // Simulate progress
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / estimatedTimeMs) * 100, 95);
      
      setProgress(prev => {
        // Don't decrease progress - only increase
        if (newProgress > prev) {
          return newProgress;
        }
        return prev;
      });

      // Update tip based on progress
      if (newProgress > 75) setCurrentTip(3);
      else if (newProgress > 50) setCurrentTip(2);
      else if (newProgress > 25) setCurrentTip(1);
      else setCurrentTip(0);
    }, 100);

    return () => {
      clearInterval(interval);
      // Set to 100% on unmount (when loading completes)
      setProgress(100);
    };
  }, [estimatedTimeMs]);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      {/* Status Message */}
      <div className="text-center space-y-2 w-full max-w-md">
        <p className="text-lg font-semibold text-blue-300">{message}</p>
        <p className="text-sm text-gray-400 animate-fade-in min-h-[20px]">{tips[currentTip]}</p>
      </div>

      {/* Progress Bar - Fixed Width with gradient reveal */}
      <div className="w-80">
        <div className="h-3 bg-gray-800/80 rounded-full overflow-hidden border border-white/10 relative">
          {/* Full gradient that spans the entire bar width, clipped by progress */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 transition-all duration-200 ease-out"
            style={{ 
              clipPath: `inset(0 ${100 - progress}% 0 0)`,
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{Math.round(progress)}%</span>
          <span>{Math.round((estimatedTimeMs * (1 - progress / 100)) / 1000)}s</span>
        </div>
      </div>

      {/* Fun animation styles */}
      <style>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 2s ease infinite;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-in;
        }
      `}</style>
    </div>
  );
};

export default LoadingProgress;
