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
      setProgress(newProgress);

      // Update tip based on progress
      if (newProgress > 75) setCurrentTip(3);
      else if (newProgress > 50) setCurrentTip(2);
      else if (newProgress > 25) setCurrentTip(1);
      else setCurrentTip(0);
    }, 100);

    return () => clearInterval(interval);
  }, [estimatedTimeMs]);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      {/* Status Message */}
      <div className="text-center space-y-2 w-full max-w-md">
        <p className="text-lg font-semibold text-blue-300">{message}</p>
        <p className="text-sm text-gray-400 animate-fade-in min-h-[20px]">{tips[currentTip]}</p>
      </div>

      {/* Progress Bar - Fixed Width */}
      <div className="w-80">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 transition-all duration-300 ease-out animate-gradient"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{Math.round(progress)}%</span>
          <span>{Math.round((estimatedTimeMs * (1 - progress / 100)) / 1000)}s</span>
        </div>
      </div>

      {/* Fun animation styles */}
      <style jsx>{`
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
