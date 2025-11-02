import React, { useState, useRef, useEffect } from 'react';
import { MagicWand, X, ArrowCounterClockwise, FloppyDisk, CircleNotch } from '@phosphor-icons/react';

interface CustomPromptEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<void>;
  onUndo: () => void;
  onSave: () => void;
  canUndo: boolean;
  isProcessing: boolean;
}

export default function CustomPromptEditor({
  isOpen,
  onClose,
  onSubmit,
  onUndo,
  onSave,
  canUndo,
  isProcessing
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
            {/* Textarea */}
            <div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Make the sky more dramatic with sunset colors, Add a smile to the person's face, Change the background to a beach scene..."
                className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-none"
                disabled={isProcessing}
                ref={textareaRef}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Be specific about what you want to change. The AI will attempt to modify the image while preserving its overall style.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {canUndo && (
                  <button
                    type="button"
                    onClick={onUndo}
                    disabled={isProcessing}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowCounterClockwise className="w-4 h-4" weight="bold" />
                    Undo
                  </button>
                )}
                {canUndo && (
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={isProcessing}
                    className="px-4 py-2.5 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FloppyDisk className="w-4 h-4" weight="bold" />
                    Save Changes
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
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
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
