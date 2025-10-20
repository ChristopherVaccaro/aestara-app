# Bottom Drawer Design Update

## Overview

Converted the FeedbackTagSelector from a centered modal to a **bottom drawer (hamburger-style)** design for better mobile UX and more space for stacked tags.

---

## Key Changes

### **1. Bottom Drawer Layout**
- Slides up from bottom of screen
- Rounded top corners (`rounded-t-3xl`)
- Takes up 85% of viewport height max
- Fixed at bottom on all screen sizes

### **2. Stacked Tags (No Grid)**
- **Full-width buttons** instead of 2-column grid
- Each tag shows label + description
- More room for text on mobile
- Better tap targets (larger buttons)
- Easier to read and select

### **3. Fixed Header & Footer**
- **Header**: Fixed at top with drag handle
- **Content**: Scrollable middle section (only tags scroll)
- **Footer**: Fixed at bottom with action buttons
- Submit/Skip buttons always visible

### **4. Mobile Gestures**
- **Drag handle** at top (visual affordance)
- **Swipe down** on header to close
- **Tap outside** to close
- **X button** to close

### **5. Smooth Animation**
- Slides up with ease-out curve
- 300ms duration
- Opacity fade-in

---

## Design Details

### **Layout Structure**
```
┌─────────────────────────────┐
│  Drag Handle (gray bar)     │ ← Fixed Header
│  Title + Close Button       │
├─────────────────────────────┤
│                             │
│  [Quality Issues]           │
│  ┌─────────────────────┐   │
│  │ Too Blurry          │   │
│  │ Result lacks sharp  │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │ ← Scrollable
│  │ Too Abstract        │   │   Content
│  │ Style too abstract  │   │
│  └─────────────────────┘   │
│                             │
│  [Style Issues]             │
│  ...                        │
│                             │
├─────────────────────────────┤
│  2 issues selected          │ ← Fixed Footer
│  [Skip]  [Submit]           │
│  Feedback helps AI improve  │
└─────────────────────────────┘
```

### **Tag Button Design**
```tsx
// Full-width stacked buttons
<button className="w-full text-left px-4 py-3 rounded-lg border-2">
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span>Tag Label</span>
        {selected && <span>✓</span>}
      </div>
      <p className="text-xs opacity-60 mt-0.5">
        Description text
      </p>
    </div>
  </div>
</button>
```

### **Color Scheme**
- Background: `glass-panel` (dark glassmorphic)
- Text: White/gray on dark
- Selected tags: Colored backgrounds (red/purple/blue/orange by category)
- Unselected: `bg-white/5` with `border-white/10`
- Hover: `border-white/20`
- Active: `scale-[0.98]` (press feedback)

---

## Mobile Optimizations

### **Touch Targets**
- Minimum 44px height for all buttons
- Full-width tags (easy to tap)
- Large close button (20px icon)
- Drag handle (visual + functional)

### **Scrolling**
- Only content area scrolls
- Header/footer stay fixed
- `overscroll-contain` prevents bounce
- Smooth momentum scrolling

### **Gestures**
```typescript
// Swipe down to close
onTouchStart: Record Y position
onTouchEnd: Calculate swipe distance
if (swipeDistance > 100px) → close drawer
```

### **Safe Areas**
- Respects mobile notches
- Bottom padding for home indicator
- Proper spacing on all devices

---

## Responsive Behavior

### **Mobile (< 640px)**
- Full-width drawer
- Stacked tags (1 column)
- Compact header
- Large touch targets

### **Tablet (640px - 1024px)**
- Full-width drawer
- Stacked tags (1 column)
- More padding
- Same layout as mobile

### **Desktop (> 1024px)**
- Still bottom drawer (consistent UX)
- Centered with max-width
- Stacked tags (better readability)
- Mouse hover states

---

## Animation Details

### **Slide-Up Animation**
```css
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
```

**Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` - Smooth ease-out with slight bounce

---

## Accessibility

### **Keyboard Navigation**
- Tab through tags
- Enter/Space to select
- Escape to close

### **Screen Readers**
- Proper ARIA labels
- Close button labeled
- Selection count announced

### **Focus Management**
- Focus trap within drawer
- Return focus on close
- Visible focus indicators

---

## Code Changes

### **Files Modified**

1. **`components/FeedbackTagSelector.tsx`**
   - Changed from centered modal to bottom drawer
   - Removed 2-column grid, added stacked layout
   - Added swipe gesture handlers
   - Added drag handle
   - Fixed header/footer with scrollable content
   - Updated button styles for full-width

2. **`glass-ui.css`**
   - Added `@keyframes slide-up` animation
   - Added `.animate-slide-up` class

### **Key Classes**

**Layout:**
- `fixed bottom-0 left-0 right-0` - Bottom drawer positioning
- `rounded-t-3xl` - Rounded top corners
- `max-h-[85vh]` - Max height (leaves space at top)
- `flex flex-col` - Vertical layout

**Sections:**
- `flex-shrink-0` - Fixed header/footer (don't shrink)
- `flex-1 overflow-y-auto` - Scrollable content (takes remaining space)
- `overscroll-contain` - Prevents scroll chaining

**Tags:**
- `w-full` - Full width
- `space-y-2` - Vertical spacing between tags
- `active:scale-[0.98]` - Press feedback

---

## Benefits

✅ **Better Mobile UX** - Native app feel with bottom drawer  
✅ **More Space** - Stacked tags are easier to read  
✅ **Always Visible Controls** - Submit/Skip never scroll away  
✅ **Intuitive Gestures** - Swipe down to close (familiar pattern)  
✅ **Larger Tap Targets** - Full-width buttons easier to tap  
✅ **Better Readability** - Descriptions visible without truncation  
✅ **Consistent with Mobile Patterns** - Matches iOS/Android conventions  

---

## Comparison: Before vs After

### **Before (Centered Modal)**
- ❌ 2-column grid cramped on mobile
- ❌ Descriptions truncated
- ❌ Small tap targets
- ❌ Controls could scroll away
- ❌ Desktop-first design

### **After (Bottom Drawer)**
- ✅ Full-width stacked tags
- ✅ Full descriptions visible
- ✅ Large, easy tap targets
- ✅ Controls always visible
- ✅ Mobile-first design
- ✅ Swipe gestures
- ✅ Drag handle affordance

---

## Testing Checklist

### **Visual**
- [ ] Drawer slides up smoothly
- [ ] Rounded top corners visible
- [ ] Drag handle centered and visible
- [ ] Tags stack vertically (no grid)
- [ ] Descriptions show without truncation
- [ ] Selected tags highlight properly
- [ ] Footer stays at bottom

### **Interaction**
- [ ] Tap tags to select/deselect
- [ ] Swipe down on header to close
- [ ] Tap outside to close
- [ ] X button closes drawer
- [ ] Skip button works
- [ ] Submit button works
- [ ] Selection count updates

### **Scrolling**
- [ ] Only content scrolls
- [ ] Header stays fixed
- [ ] Footer stays fixed
- [ ] Smooth momentum scrolling
- [ ] No overscroll bounce

### **Mobile**
- [ ] Works on iPhone (all sizes)
- [ ] Works on Android (all sizes)
- [ ] Safe area respected
- [ ] Touch targets large enough
- [ ] Gestures feel natural

---

## Future Enhancements

Potential improvements:

1. **Drag-to-Dismiss** - Drag drawer down to close (not just swipe)
2. **Haptic Feedback** - Vibrate on selection (mobile)
3. **Search/Filter** - Search tags by keyword
4. **Collapsible Categories** - Expand/collapse categories
5. **Quick Actions** - "Select all quality issues" button
6. **Animation on Select** - Subtle scale/color animation
7. **Undo Selection** - Shake to clear all selections

---

## Summary

The FeedbackTagSelector is now a **mobile-first bottom drawer** with:
- 🎯 Stacked full-width tags (better readability)
- 📱 Fixed header/footer (controls always visible)
- 👆 Swipe gestures (intuitive mobile UX)
- ✨ Smooth animations (polished feel)
- 🎨 Consistent glass design (matches app aesthetic)

**Perfect for mobile users while still great on desktop!**
