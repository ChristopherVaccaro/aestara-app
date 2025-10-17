import React, { useEffect, useState } from 'react';

interface BlurredImageLoadingProps {
  originalImageUrl: string;
  message?: string;
  estimatedTimeMs?: number;
}

const BlurredImageLoading: React.FC<BlurredImageLoadingProps> = ({
  originalImageUrl,
  message = 'Generating style...',
  estimatedTimeMs = 10000,
}) => {
  const [progress, setProgress] = useState(0);
  const [blurAmount, setBlurAmount] = useState(20);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / estimatedTimeMs) * 100, 95);
      setProgress(newProgress);
      
      // Gradually reduce blur as progress increases
      // Start at 20px blur, reduce to 5px at 95% progress
      const newBlur = 20 - (newProgress / 95) * 15;
      setBlurAmount(Math.max(newBlur, 5));
    }, 50);

    return () => clearInterval(interval);
  }, [estimatedTimeMs]);

  return (
    <div className="relative w-full aspect-square rounded-2xl overflow-hidden">
      {/* Gradient Border Wrapper */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 p-[2px] rounded-2xl">
        <div className="h-full w-full rounded-2xl bg-gray-900/95 backdrop-blur-xl overflow-hidden relative">
          {/* Blurred Original Image */}
          <img 
            src={originalImageUrl} 
            alt="Processing" 
            className="w-full h-full object-cover transition-all duration-300"
            style={{
              filter: `blur(${blurAmount}px) brightness(0.7)`,
            }}
          />
          
          {/* Overlay gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40" />
          
          {/* Loading Content Overlay - Hidden when progress reaches 100% */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300"
            style={{ opacity: progress >= 100 ? 0 : 1 }}
          >
            {/* Message */}
            <p className="text-white text-lg font-semibold mb-4 px-4 text-center drop-shadow-lg">
              {message}
            </p>
            
            {/* Progress Bar */}
            <div className="w-64 px-4">
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 transition-all duration-300 ease-out"
                  style={{ 
                    width: `${progress}%`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s linear infinite'
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-white/80 drop-shadow">
                <span>{Math.round(progress)}%</span>
                <span>{Math.round((estimatedTimeMs * (1 - progress / 100)) / 1000)}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default BlurredImageLoading;
