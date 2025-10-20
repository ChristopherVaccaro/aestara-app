import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { recordVote, getVoteStats, VOTE_THRESHOLD } from '../services/voteTrackingService';

interface GenerationFeedbackProps {
  filterName: string;
  generationId: string;
  onVoteRecorded?: (isPositive: boolean) => void;
}

export const GenerationFeedback: React.FC<GenerationFeedbackProps> = ({
  filterName,
  generationId,
  onVoteRecorded,
}) => {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleVote = async (isPositive: boolean) => {
    // UNLIMITED VOTING - Allow multiple votes
    setVoted(isPositive ? 'up' : 'down');
    setIsAnimating(true);
    
    // Record the vote (always succeeds now)
    await recordVote(filterName, isPositive, generationId);
    
    // Trigger animation
    setTimeout(() => {
      setIsAnimating(false);
      // Reset voted state after animation to allow re-voting
      setTimeout(() => setVoted(null), 1000);
    }, 300);
    
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
        <span className="text-sm text-white/60">Rate this image:</span>
        
        <button
          onClick={() => handleVote(true)}
          className={`
            p-2 rounded-lg transition-all duration-200
            ${voted === 'up' 
              ? 'bg-green-500/20 text-green-400 scale-110' 
              : 'hover:bg-white/10 text-white/70 hover:text-white hover:scale-110'
            }
            ${isAnimating && voted === 'up' ? 'animate-bounce' : ''}
          `}
          aria-label="Thumbs up"
        >
          <ThumbsUp className="w-5 h-5" />
        </button>

        <button
          onClick={() => handleVote(false)}
          className={`
            p-2 rounded-lg transition-all duration-200
            ${voted === 'down' 
              ? 'bg-red-500/20 text-red-400 scale-110' 
              : 'hover:bg-white/10 text-white/70 hover:text-white hover:scale-110'
            }
            ${isAnimating && voted === 'down' ? 'animate-bounce' : ''}
          `}
          aria-label="Thumbs down"
        >
          <ThumbsDown className="w-5 h-5" />
        </button>
      </div>

      {voted && (
        <div className="text-xs text-white/40 animate-fade-in">
          Thanks for your feedback!
        </div>
      )}
    </div>
  );
};
