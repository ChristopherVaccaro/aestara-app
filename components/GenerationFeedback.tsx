import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { recordVote, getVoteStats, VOTE_THRESHOLD } from '../services/voteTrackingService';

interface GenerationFeedbackProps {
  filterName: string;
  generationId: string;
  filterId?: string;
  currentPrompt?: string;
  onVoteRecorded?: (isPositive: boolean) => void;
}

export const GenerationFeedback: React.FC<GenerationFeedbackProps> = ({
  filterName,
  generationId,
  filterId,
  currentPrompt,
  onVoteRecorded,
}) => {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState(generationId);

  // Reset vote when generationId changes (new image generated)
  useEffect(() => {
    if (generationId !== currentGenerationId) {
      setVoted(null);
      setIsAnimating(false);
      setCurrentGenerationId(generationId);
    }
  }, [generationId, currentGenerationId]);

  const handleVote = async (isPositive: boolean) => {
    // Only allow one vote per generation
    if (voted) return;
    
    setVoted(isPositive ? 'up' : 'down');
    setIsAnimating(true);
    
    // Record the vote (with filterId and prompt for auto-refinement)
    await recordVote(filterName, isPositive, generationId, filterId, currentPrompt);
    
    // Trigger animation
    setTimeout(() => setIsAnimating(false), 300);
    
    // Notify parent component
    onVoteRecorded?.(isPositive);

    // Log vote stats in dev mode (localhost)
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isDev) {
      const stats = await getVoteStats(filterName);
      if (stats) {
        console.log(`📊 ${filterName} votes:`, {
          thumbsUp: stats.thumbsUp,
          thumbsDown: stats.thumbsDown,
          total: stats.totalVotes,
          threshold: VOTE_THRESHOLD,
          needsMore: VOTE_THRESHOLD - stats.totalVotes,
        });
      }
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-3">
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
        {voted ? (
          // Show thank you message after voting
          <span className="text-sm text-white/80 animate-fade-in">
            Thanks for your feedback!
          </span>
        ) : (
          // Show rating buttons before voting
          <>
            <span className="text-sm text-white/60">Rate this image:</span>
            
            <button
              onClick={() => handleVote(true)}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-white/10 text-white/70 hover:text-white hover:scale-110"
              aria-label="Thumbs up"
            >
              <ThumbsUp className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleVote(false)}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-white/10 text-white/70 hover:text-white hover:scale-110"
              aria-label="Thumbs down"
            >
              <ThumbsDown className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
