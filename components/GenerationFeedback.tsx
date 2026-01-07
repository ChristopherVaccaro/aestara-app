import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from '@phosphor-icons/react';
import { recordVote, getVoteStats, VOTE_THRESHOLD } from '../services/voteTrackingService';
import { FeedbackTagSelector } from './FeedbackTagSelector';
import { recordVoteFeedback, updateFeedbackSummary } from '../services/feedbackTagService';

interface GenerationFeedbackProps {
  filterName: string;
  generationId: string;
  filterId?: string;
  currentPrompt?: string;
  onVoteRecorded?: (isPositive: boolean) => void;
  onShowToast?: (message: string, type: 'success' | 'info') => void;
  wrapperClassName?: string;
}

export const GenerationFeedback: React.FC<GenerationFeedbackProps> = ({
  filterName,
  generationId,
  filterId,
  currentPrompt,
  onVoteRecorded,
  onShowToast,
  wrapperClassName,
}) => {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState(generationId);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [pendingVoteId, setPendingVoteId] = useState<string | null>(null);

  // Reset vote when generationId changes (new image generated)
  useEffect(() => {
    if (generationId !== currentGenerationId) {
      setVoted(null);
      setIsAnimating(false);
      setCurrentGenerationId(generationId);
      setShowTagSelector(false);
      setPendingVoteId(null);
    }
  }, [generationId, currentGenerationId]);

  const handleRefinementTriggered = (filterName: string) => {
    // Show toast when AI refinement is triggered
    onShowToast?.(
      `✨ AI is improving "${filterName}" based on your feedback! The prompt is being refined for better results.`,
      'info'
    );
  };

  const handleVote = async (isPositive: boolean) => {
    // Only allow one vote per generation
    if (voted) return;
    
    if (isPositive) {
      // Thumbs up: record immediately
      setVoted('up');
      setIsAnimating(true);
      
      const voteId = await recordVote(
        filterName, 
        isPositive, 
        generationId, 
        filterId, 
        currentPrompt,
        handleRefinementTriggered
      );
      
      setTimeout(() => setIsAnimating(false), 300);
      onVoteRecorded?.(isPositive);
      
      logVoteStats();
    } else {
      // Thumbs down: show tag selector first
      const voteId = await recordVote(
        filterName, 
        isPositive, 
        generationId, 
        filterId, 
        currentPrompt,
        handleRefinementTriggered
      );
      
      if (voteId) {
        setPendingVoteId(voteId);
        setShowTagSelector(true);
      } else {
        // Fallback if vote recording fails
        setVoted('down');
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
        onVoteRecorded?.(isPositive);
      }
    }
  };

  const handleTagsSubmit = async (selectedTagIds: string[]) => {
    if (pendingVoteId && selectedTagIds.length > 0) {
      // Record the selected tags
      await recordVoteFeedback(pendingVoteId, selectedTagIds);
      
      // Update feedback summary for this filter (background)
      if (filterId) {
        updateFeedbackSummary(filterId).catch(err => 
          console.error('Error updating feedback summary:', err)
        );
      }
    }
    
    // Complete the downvote
    setVoted('down');
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    onVoteRecorded?.(false);
    
    logVoteStats();
  };

  const logVoteStats = async () => {
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

  const outerClasses =
    wrapperClassName ??
    'flex items-center justify-center gap-4 mt-3';

  return (
    <>
      <FeedbackTagSelector
        isOpen={showTagSelector}
        onClose={() => {
          setShowTagSelector(false);
          // Complete vote even if closed without selection
          if (pendingVoteId) {
            handleTagsSubmit([]);
          }
        }}
        onSubmit={handleTagsSubmit}
        filterName={filterName}
        onShowToast={onShowToast}
      />
      
      <div className={outerClasses}>
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
    </>
  );
};
