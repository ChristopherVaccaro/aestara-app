import React, { useState } from 'react';

interface ShareButtonProps {
  imageUrl: string | null;
  styleName?: string;
  onShare?: () => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({ imageUrl, styleName, onShare }) => {
  const [isSharing, setIsSharing] = useState(false);

  const shareData = {
    title: `AI Stylized Image${styleName ? ` - ${styleName}` : ''}`,
    text: `Check out this cool ${styleName || 'stylized'} image I created with AI! Try it yourself at: ${window.location.origin}`,
    url: window.location.origin
  };

  const handleNativeShare = async () => {
    if (!imageUrl) return;

    setIsSharing(true);
    onShare?.();

    try {
      // Convert base64 to blob for sharing
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `stylized-${styleName || 'image'}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          files: [file]
        });
      } else if (navigator.share) {
        // Fallback without file
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url
        });
      } else {
        // Show fallback options
        showFallbackOptions();
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Sharing failed:', error);
        showFallbackOptions();
      }
    } finally {
      setIsSharing(false);
    }
  };

  const showFallbackOptions = () => {
    const emailSubject = encodeURIComponent(shareData.title);
    const emailBody = encodeURIComponent(`${shareData.text}\n\nI've attached the stylized image I created!`);
    const smsBody = encodeURIComponent(shareData.text);

    // Create temporary modal with options
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="glass-panel p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold text-white mb-4">Share Your Creation</h3>
        <div class="space-y-3">
          <a href="mailto:?subject=${emailSubject}&body=${emailBody}" 
             class="w-full px-4 py-3 bg-blue-500/20 border border-blue-400/30 text-blue-100 rounded-xl hover:bg-blue-500/30 transition-all duration-300 flex items-center gap-3 text-decoration-none">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
            </svg>
            Share via Email
          </a>
          <a href="sms:?body=${smsBody}" 
             class="w-full px-4 py-3 bg-green-500/20 border border-green-400/30 text-green-100 rounded-xl hover:bg-green-500/30 transition-all duration-300 flex items-center gap-3 text-decoration-none">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/>
            </svg>
            Share via Text
          </a>
          <button onclick="navigator.clipboard.writeText('${shareData.text}'); this.textContent='Copied!'" 
                  class="w-full px-4 py-3 bg-purple-500/20 border border-purple-400/30 text-purple-100 rounded-xl hover:bg-purple-500/30 transition-all duration-300 flex items-center gap-3">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z"/>
              <path d="M3 5a2 2 0 012-2 3 3 0 003 3h6a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L14.586 13H19v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11.586V9a1 1 0 10-2 0v2.586l.293-.293a1 1 0 011.414 0l.293.293z"/>
            </svg>
            Copy Link
          </button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                  class="w-full px-4 py-2 bg-gray-500/20 border border-gray-400/30 text-gray-300 rounded-xl hover:bg-gray-500/30 transition-all duration-300">
            Cancel
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Remove modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  };

  if (!imageUrl) {
    return null;
  }

  return (
    <button
      onClick={handleNativeShare}
      disabled={isSharing}
      className="w-full px-6 py-3 bg-blue-500/20 backdrop-blur-xl border border-blue-400/30 text-blue-100 font-semibold rounded-2xl hover:bg-blue-500/30 hover:border-blue-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {isSharing ? (
        <>
          <div className="w-4 h-4 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin" />
          Sharing...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          Share with Friends
        </>
      )}
    </button>
  );
};

export default ShareButton;
