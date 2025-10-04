# Quick Integration Guide

## How to Integrate New UX Components

### 1. Replace "Hold to Peek" with Comparison Slider

**In App.tsx**, replace the ImageDisplay component usage:

```tsx
// BEFORE:
<ImageDisplay
  originalImageUrl={originalImageUrl}
  generatedImageUrl={generatedImageUrl}
  isLoading={isLoading}
  isPeeking={isPeeking}
  onPeekStart={handlePeekStart}
  onPeekEnd={handlePeekEnd}
  onOpenPreview={handleOpenPreview}
  onDownload={handleDownload}
  error={error}
  activeFilterName={activeFilter?.name || null}
/>

// AFTER:
import ImageComparison from './components/ImageComparison';

{isLoading ? (
  <LoadingProgress 
    message={activeFilter ? `Applying ${activeFilter.name}...` : 'Processing...'}
    estimatedTimeMs={10000}
  />
) : generatedImageUrl ? (
  <ImageComparison
    originalImageUrl={originalImageUrl}
    generatedImageUrl={generatedImageUrl}
    activeFilterName={activeFilter?.name || 'Styled'}
  />
) : (
  <img src={originalImageUrl} alt="Original" className="w-full rounded-3xl" />
)}
```

---

### 2. Add Style History System

**In App.tsx**, add these state variables:

```tsx
import StyleHistory, { HistoryItem } from './components/StyleHistory';

// Add state
const [history, setHistory] = useState<HistoryItem[]>([]);
const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

// Modify handleApplyFilter:
const handleApplyFilter = async (filter: Filter) => {
  if (!imageFile) return;
  setIsLoading(true);
  setError(null);
  setActiveFilter(filter);
  
  try {
    const composedPrompt = `${STYLE_TRANSFER_CONSTRAINTS}\n\n${filter.prompt}`;
    const base64Data = await applyImageFilter(imageFile, composedPrompt);
    const newImageUrl = `data:image/png;base64,${base64Data}`;
    setGeneratedImageUrl(newImageUrl);
    
    // ADD HISTORY ENTRY
    const newHistoryItem: HistoryItem = {
      id: Date.now().toString(),
      imageUrl: newImageUrl,
      filterName: filter.name,
      filterId: filter.id,
      timestamp: Date.now(),
    };
    
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    setHistory([...newHistory, newHistoryItem]);
    setCurrentHistoryIndex(newHistory.length);
    
  } catch (err) {
    // ... error handling
  } finally {
    setIsLoading(false);
  }
};

// Add history handlers:
const handleSelectHistory = (index: number) => {
  if (history[index]) {
    setGeneratedImageUrl(history[index].imageUrl);
    setCurrentHistoryIndex(index);
    const filter = FILTER_CATEGORIES
      .flatMap(cat => cat.filters)
      .find(f => f.id === history[index].filterId);
    setActiveFilter(filter || null);
  }
};

const handleClearHistory = () => {
  setHistory([]);
  setCurrentHistoryIndex(-1);
};

// Add in JSX (in the right column, above FilterSelector):
{history.length > 0 && (
  <StyleHistory
    history={history}
    currentIndex={currentHistoryIndex}
    onSelectHistory={handleSelectHistory}
    onClearHistory={handleClearHistory}
  />
)}
```

---

### 3. Add Keyboard Shortcuts

**In App.tsx**:

```tsx
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Add inside App component:
const handleUndo = () => {
  if (currentHistoryIndex > 0) {
    handleSelectHistory(currentHistoryIndex - 1);
  }
};

const handleRedo = () => {
  if (currentHistoryIndex < history.length - 1) {
    handleSelectHistory(currentHistoryIndex + 1);
  }
};

useKeyboardShortcuts({
  onUndo: handleUndo,
  onRedo: handleRedo,
  onDownload: handleDownload,
  onReset: handleReset,
});
```

---

### 4. Add Toast Notifications

**In App.tsx**:

```tsx
import { useToast, ToastContainer } from './components/Toast';

// Add at component level:
const { toasts, addToast, removeToast } = useToast();

// Use in handlers:
const handleApplyFilter = async (filter: Filter) => {
  try {
    // ... filter logic
    addToast(`${filter.name} style applied successfully!`, 'success');
  } catch (err) {
    addToast('Failed to apply style. Please try again.', 'error');
  }
};

const handleDownload = () => {
  if (!generatedImageUrl) return;
  // ... download logic
  addToast('Image downloaded successfully!', 'success');
};

// Add to JSX (at root level):
<ToastContainer toasts={toasts} removeToast={removeToast} />
```

---

### 5. Upgrade Loading States

**Replace Spinner with LoadingProgress**:

```tsx
import LoadingProgress from './components/LoadingProgress';

// In ImageDisplay or wherever you show loading:
{isLoading && (
  <LoadingProgress 
    message={activeFilter ? `Applying ${activeFilter.name}...` : 'Processing image...'}
    estimatedTimeMs={10000}
  />
)}
```

---

## Complete App.tsx Integration Example

Here's a minimal example showing all components integrated:

```tsx
import React, { useState } from 'react';
import ImageComparison from './components/ImageComparison';
import StyleHistory, { HistoryItem } from './components/StyleHistory';
import LoadingProgress from './components/LoadingProgress';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useToast, ToastContainer } from './components/Toast';

const App: React.FC = () => {
  // Existing state...
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const { toasts, addToast, removeToast } = useToast();

  // History handlers
  const handleSelectHistory = (index: number) => {
    if (history[index]) {
      setGeneratedImageUrl(history[index].imageUrl);
      setCurrentHistoryIndex(index);
    }
  };

  const handleUndo = () => {
    if (currentHistoryIndex > 0) {
      handleSelectHistory(currentHistoryIndex - 1);
      addToast('Undo', 'info');
    }
  };

  const handleRedo = () => {
    if (currentHistoryIndex < history.length - 1) {
      handleSelectHistory(currentHistoryIndex + 1);
      addToast('Redo', 'info');
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDownload: handleDownload,
    onReset: handleReset,
  });

  return (
    <div className="app">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Main content */}
      <div className="content">
        {/* Image Display */}
        {isLoading ? (
          <LoadingProgress 
            message={`Applying ${activeFilter?.name || 'style'}...`}
            estimatedTimeMs={10000}
          />
        ) : generatedImageUrl ? (
          <ImageComparison
            originalImageUrl={originalImageUrl}
            generatedImageUrl={generatedImageUrl}
            activeFilterName={activeFilter?.name || 'Styled'}
          />
        ) : originalImageUrl ? (
          <img src={originalImageUrl} alt="Original" />
        ) : (
          <ImageUploader onImageUpload={handleImageUpload} />
        )}

        {/* Sidebar with History */}
        <div className="sidebar">
          {history.length > 0 && (
            <StyleHistory
              history={history}
              currentIndex={currentHistoryIndex}
              onSelectHistory={handleSelectHistory}
              onClearHistory={() => setHistory([])}
            />
          )}
          
          <FilterSelector {...filterProps} />
        </div>
      </div>
    </div>
  );
};

export default App;
```

---

## CSS Requirements

Add these to your global CSS or Tailwind config:

```css
/* Scrollbar styles for history */
.scrollbar-thin::-webkit-scrollbar {
  height: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(147, 51, 234, 0.5);
  border-radius: 2px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(147, 51, 234, 0.7);
}

/* Smooth transitions for all interactive elements */
button, a, [role="button"] {
  transition: all 0.2s ease;
}

/* Focus visible for accessibility */
*:focus-visible {
  outline: 2px solid #9333ea;
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Testing Checklist

- [ ] Comparison slider works on desktop (mouse drag)
- [ ] Comparison slider works on mobile (touch drag)
- [ ] History navigation works (click thumbnails)
- [ ] Undo/Redo works (Ctrl+Z, Ctrl+Y)
- [ ] Keyboard shortcuts work
- [ ] Toast notifications appear and auto-dismiss
- [ ] Loading progress shows with tips
- [ ] Empty state shows use cases
- [ ] All interactive elements have focus states
- [ ] Screen reader announces loading states
- [ ] Works on Chrome, Firefox, Safari
- [ ] Works on iOS and Android mobile browsers

---

## Performance Tips

1. **Lazy Load Components**: Use React.lazy() for heavy components
2. **Memoize Callbacks**: Use useCallback for handlers passed to children
3. **Optimize Images**: Compress history thumbnails
4. **Debounce History Updates**: Don't save every interaction
5. **Limit History Size**: Keep max 10-20 items

```tsx
// Example: Limit history to 10 items
const MAX_HISTORY = 10;

const addToHistory = (item: HistoryItem) => {
  setHistory(prev => {
    const newHistory = [...prev, item];
    return newHistory.slice(-MAX_HISTORY); // Keep only last 10
  });
};
```

---

## Need Help?

Refer to:
- `UX_IMPROVEMENTS.md` for detailed research and rationale
- Individual component files for prop types and API
- `hooks/useKeyboardShortcuts.ts` for keyboard shortcut customization
- `components/Toast.tsx` for toast notification options
