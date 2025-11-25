import React, { useState, useRef, useEffect } from 'react';
import { MagicWand, X, CircleNotch } from '@phosphor-icons/react';

interface CustomPromptEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<void>;
  isProcessing: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export default function CustomPromptEditor({
  isOpen,
  onClose,
  onSubmit,
  isProcessing,
  error,
  onClearError
}: CustomPromptEditorProps) {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && !isProcessing) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [isOpen, isProcessing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      return;
    }

    try {
      await onSubmit(prompt.trim());
      setPrompt(''); // Clear after successful submission
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    setPrompt('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Overlay Panel */}
      <div className="fixed inset-x-0 top-1/2 -translate-y-1/2 z-50 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="glass-panel p-6 md:p-8 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <MagicWand className="w-5 h-5 text-white" weight="bold" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">AI Image Editor</h3>
                <p className="text-sm text-gray-400">Describe the changes you want to make</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              disabled={isProcessing}
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-300 text-sm font-medium">AI Edit Failed</p>
                  <p className="text-red-400/80 text-xs mt-1">{error}</p>
                </div>
                {onClearError && (
                  <button
                    onClick={onClearError}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Textarea */}
            <div>
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (error && onClearError) onClearError();
                }}
                placeholder="Example: Make the sky more dramatic with sunset colors, Add a smile to the person's face, Change the background to a beach scene..."
                className={`w-full h-32 px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-none ${
                  error ? 'border-red-500/50' : 'border-white/10'
                }`}
                disabled={isProcessing}
                ref={textareaRef}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Be specific about what you want to change. The AI will attempt to modify the image while preserving its overall style.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing || !prompt.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
                    Processing...
                  </>
                ) : (
                  <>
                    <MagicWand className="w-4 h-4" weight="bold" />
                    Apply Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
