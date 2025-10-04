# Memory Management - Style History

## How Style History Images Are Stored

### Storage Location
Style history images are stored **in browser memory only** using **Data URLs** (base64-encoded strings). They are NOT stored in:
- ❌ LocalStorage
- ❌ SessionStorage
- ❌ IndexedDB
- ❌ Server/Database
- ❌ Disk/File System

### Memory Lifecycle

#### 1. **When Images Are Created**
```typescript
// In App.tsx line 145-161
const newImageUrl = `data:image/png;base64,${base64Data}`;
const newHistoryItem: HistoryItem = {
  id: Date.now().toString(),
  imageUrl: newImageUrl,  // Base64 data URL stored in RAM
  filterName: filter.name,
  filterId: filter.id,
  timestamp: Date.now(),
};
```

#### 2. **Memory Protection - MAX_HISTORY Limit**
```typescript
// In App.tsx line 117
const MAX_HISTORY = 15; // Limit history to prevent memory issues

// In App.tsx line 159-161
const newHistory = history.slice(0, currentHistoryIndex + 1);
const updatedHistory = [...newHistory, newHistoryItem].slice(-MAX_HISTORY);
setHistory(updatedHistory);
```
- Only the **last 15 styled images** are kept in memory
- When the 16th image is added, the oldest one is automatically removed
- This prevents unlimited memory growth

#### 3. **When Memory Is Cleared**

Memory is **automatically cleared** in these scenarios:

##### A. **New Image Upload** (App.tsx line 119-127)
```typescript
const handleImageUpload = (file: File) => {
  // ... other code ...
  setHistory([]);  // ✅ History cleared
  setCurrentHistoryIndex(-1);
};
```

##### B. **Reset Button** (App.tsx line 178-189)
```typescript
const handleReset = () => {
  // ... other code ...
  setHistory([]);  // ✅ History cleared
  setCurrentHistoryIndex(-1);
};
```

##### C. **Manual Clear** (App.tsx line 223-226)
```typescript
const handleClearHistory = () => {
  setHistory([]);  // ✅ History cleared
  setCurrentHistoryIndex(-1);
};
```

##### D. **Browser Tab/Window Close**
- All React state is lost
- Memory is freed by the browser
- Nothing persists

##### E. **Page Refresh**
- All state is reset
- Memory is completely cleared

## Memory Usage Estimates

### Per Image
- **Original uploaded image**: ~500KB - 2MB (depends on size)
- **Each styled image in history**: ~500KB - 2MB (base64 encoded)
- **15 images max**: ~7.5MB - 30MB total

### Total App Memory
- React app overhead: ~5-10MB
- Style history (15 images): ~7.5-30MB
- Current displayed images: ~2-4MB
- **Total estimated**: ~15-45MB

This is well within browser memory limits (browsers typically allow 100MB+ per tab).

## Best Practices for Users

### To Minimize Memory Usage:
1. **Clear history manually** when done experimenting with styles
2. **Upload new images** to automatically clear old history
3. **Close/refresh the tab** when finished to free all memory
4. **Avoid keeping multiple tabs open** with the app

### Memory Is Safe Because:
✅ **Automatic limit** of 15 images prevents runaway growth
✅ **No persistent storage** - everything clears on page close
✅ **Automatic cleanup** when uploading new images
✅ **Manual clear option** available in the UI
✅ **No server storage** - no backend costs or privacy concerns

## Technical Details

### Why Data URLs?
```typescript
imageUrl: `data:image/png;base64,${base64Data}`
```

**Advantages:**
- ✅ Simple to implement
- ✅ Works entirely client-side
- ✅ No external storage needed
- ✅ Instant access (no network requests)
- ✅ Automatically garbage collected

**Disadvantages:**
- ⚠️ Uses browser RAM (not an issue with 15-image limit)
- ⚠️ Lost on page refresh (intentional for privacy)

### Alternative Approaches (Not Used)

#### 1. **Blob URLs** (More memory efficient)
```typescript
// Could use: URL.createObjectURL(blob)
// Pros: Less memory than base64
// Cons: Need manual cleanup with URL.revokeObjectURL()
```

#### 2. **IndexedDB** (Persistent storage)
```typescript
// Could persist across sessions
// Pros: Survives page refresh
// Cons: More complex, privacy concerns, needs cleanup
```

#### 3. **LocalStorage** (Not suitable)
```typescript
// Limited to 5-10MB total
// Would exceed limits with just 2-3 images
```

## Monitoring Memory (For Developers)

To check memory usage in Chrome DevTools:
1. Open DevTools (F12)
2. Go to **Performance** tab
3. Click **Memory** icon
4. Take heap snapshot
5. Look for "Detached" objects

## Conclusion

**Your memory concerns are addressed by:**
1. ✅ **15-image hard limit** prevents excessive memory use
2. ✅ **Automatic clearing** on new uploads and resets
3. ✅ **No persistent storage** - fresh start every session
4. ✅ **Manual clear option** for user control
5. ✅ **Reasonable memory footprint** (~15-45MB typical)

The current implementation is **safe, efficient, and user-friendly** for typical usage patterns.
