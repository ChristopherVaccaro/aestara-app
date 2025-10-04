import { useEffect } from 'react';

interface KeyboardShortcuts {
  onUndo?: () => void;
  onRedo?: () => void;
  onDownload?: () => void;
  onReset?: () => void;
  onCompare?: () => void;
}

export const useKeyboardShortcuts = ({
  onUndo,
  onRedo,
  onDownload,
  onReset,
  onCompare,
}: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl/Cmd + Z: Undo
      if (modifier && e.key === 'z' && !e.shiftKey && onUndo) {
        e.preventDefault();
        onUndo();
      }

      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z: Redo
      if (
        (modifier && e.key === 'y') ||
        (modifier && e.shiftKey && e.key === 'z')
      ) {
        if (onRedo) {
          e.preventDefault();
          onRedo();
        }
      }

      // Ctrl/Cmd + S: Download
      if (modifier && e.key === 's' && onDownload) {
        e.preventDefault();
        onDownload();
      }

      // Ctrl/Cmd + R: Reset (with confirmation)
      if (modifier && e.key === 'r' && onReset) {
        e.preventDefault();
        if (confirm('Reset and upload a new image?')) {
          onReset();
        }
      }

      // Space: Toggle comparison
      if (e.key === ' ' && onCompare) {
        e.preventDefault();
        onCompare();
      }

      // ?: Show keyboard shortcuts
      if (e.key === '?' && (e.shiftKey || e.key === '?')) {
        e.preventDefault();
        showShortcutsModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, onDownload, onReset, onCompare]);
};

const showShortcutsModal = () => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const mod = isMac ? '⌘' : 'Ctrl';

  alert(`Keyboard Shortcuts:
  
${mod} + Z - Undo last style
${mod} + Y - Redo style
${mod} + S - Download image
${mod} + R - Upload new image
Space - Hold to compare
? - Show shortcuts
  `);
};

export default useKeyboardShortcuts;
