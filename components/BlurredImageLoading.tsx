import React, { useEffect, useState, useRef } from 'react';

interface BlurredImageLoadingProps {
  originalImageUrl: string;
  message?: string;
  estimatedTimeMs?: number;
  /** Unique ID for this generation - when it changes, progress resets */
  generationId?: string;
}

// Global map to track start times by generation ID (persists across remounts)
const generationStartTimes = new Map<string, number>();

const BlurredImageLoading: React.FC<BlurredImageLoadingProps> = ({
  originalImageUrl,
  message = 'Generating style...',
  estimatedTimeMs = 10000,
  generationId,
}) => {
  const [progress, setProgress] = useState(0);
  const [blurAmount, setBlurAmount] = useState(20);
  const currentGenIdRef = useRef<string | undefined>(generationId);

  useEffect(() => {
    // Get or create start time for this generation
    const genKey = generationId || 'default';
    
    // If generation ID changed, clear old start time
    if (currentGenIdRef.current !== generationId) {
      generationStartTimes.delete(currentGenIdRef.current || 'default');
      currentGenIdRef.current = generationId;
    }
    
    // Get existing start time or create new one
    let startTime = generationStartTimes.get(genKey);
    if (!startTime) {
      startTime = Date.now();
      generationStartTimes.set(genKey, startTime);
    }
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime!;
      // Progress to 92% max, then slow down significantly to pause near completion
      let newProgress: number;
      if (elapsed < estimatedTimeMs * 0.9) {
        // Normal progress to ~90%
        newProgress = (elapsed / estimatedTimeMs) * 100;
      } else {
        // Slow crawl from 90% to 95% - takes 3x as long per percent
        const extraElapsed = elapsed - (estimatedTimeMs * 0.9);
        const extraProgress = (extraElapsed / (estimatedTimeMs * 0.3)) * 5;
        newProgress = 90 + Math.min(extraProgress, 5);
      }
      newProgress = Math.min(newProgress, 95);
      
      setProgress(prev => Math.max(prev, newProgress)); // Never decrease
      
      // Gradually reduce blur as progress increases
      const newBlur = 20 - (newProgress / 95) * 15;
      setBlurAmount(Math.max(newBlur, 5));
    }, 50);

    return () => {
      clearInterval(interval);
      // Clean up start time when component unmounts and generation is done
      // (parent will change generationId for new generations)
    };
  }, [estimatedTimeMs, generationId]);

  return (
    <div className="relative w-full responsive-image-container">
      {/* Gradient Border Wrapper */}
      <div className="relative h-full bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 p-[2px] rounded-2xl">
        <div className="h-full w-full rounded-2xl bg-gray-900/95 backdrop-blur-xl overflow-hidden relative flex items-center justify-center">
          {/* Blurred Original Image */}
          <img 
            src={originalImageUrl} 
            alt="Processing" 
            className="w-full h-full object-contain transition-all duration-300"
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
            
            {/* Segmented Progress Bar - Larger segments */}
            <div className="w-72 px-4">
              <div className="flex gap-1.5">
                {Array.from({ length: 10 }).map((_, i) => {
                  const segmentProgress = (i + 1) * 10; // Each segment = 10%
                  const isActive = progress >= segmentProgress;
                  return (
                    <div
                      key={i}
                      className={`h-3 flex-1 rounded transition-all duration-150 ${
                        isActive 
                          ? 'bg-blue-500' 
                          : 'bg-white/10'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-white/80 drop-shadow">
                <span>{Math.round(progress)}%</span>
                <span>{Math.round((estimatedTimeMs * (1 - progress / 100)) / 1000)}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default BlurredImageLoading;
