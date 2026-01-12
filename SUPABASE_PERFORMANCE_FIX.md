# Supabase Performance Fix - Findings & Verification

## Executive Summary

This document details the fixes applied to prevent Supabase DB resource exhaustion. The main issues identified were:

1. **Unbuffered analytics writes** - Every generation triggered immediate DB writes
2. **useEffect dependency issues** - User object reference changes caused refetching
3. **Missing observability** - No way to detect runaway DB calls
4. **No circuit breaker** - Failed requests could retry indefinitely

---

## Findings Report

### ✅ Singleton Supabase Client (No Issue Found)
**File:** `utils/supabaseClient.ts`
- Already had a single `createClient` call at module scope
- **Enhanced:** Added explicit singleton guard, debug mode support, and instance counting

### ✅ Auth Listener (Minor Enhancement)
**File:** `contexts/AuthContext.tsx`
- Properly sets up and cleans up auth listener with `subscription.unsubscribe()`
- Uses `isMounted` flag to prevent stale updates
- **Enhanced:** Added `trackAuthListener()` for debugging, reduced console noise

### ✅ Realtime Subscriptions (No Issue Found)
- **No `.channel()` usage found in app code** - only in node_modules
- No realtime subscription leaks to fix

### ⚠️ useEffect Dependency Issues (FIXED)
**Files:**
- `components/ProfilePage.tsx` - Depended on `[user]` object
- `components/AdminDashboard.tsx` - Depended on `[user]` object

**Problem:** When `user` object reference changes (even with same data), useEffect re-runs and refetches data.

**Fix:** Changed dependencies to stable primitives (`user?.id`, `user?.email`) and added `loadedUserIdRef` / `hasLoadedRef` guards.

### ⚠️ Unbuffered Analytics Writes (FIXED)
**Files:**
- `services/userPromptUsageService.ts` - Immediate DB write on every generation
- `services/promptService.ts` - Immediate DB write to increment generation count

**Problem:** Every image generation triggered 2+ immediate DB writes:
1. `recordPromptUsage()` - select + insert/update
2. `incrementGenerationCount()` - RPC or select + update

**Fix:** Created `utils/analyticsBuffer.ts` that:
- Queues events in memory
- Debounces same-type writes (1 second minimum)
- Flushes every 5 seconds or on page hide/unload
- Batches generation count increments by filter_id
- Includes kill switch via `VITE_DISABLE_ANALYTICS=true`

### ⚠️ Missing Observability (FIXED)
**Problem:** No way to detect runaway DB calls or connection issues.

**Fix:** Created `utils/supabaseDebug.ts` with:
- `logDbCall(table, operation)` - Tracks DB calls per minute
- `trackAuthListener(action)` - Monitors auth listener count
- `trackRealtimeChannel(action)` - Monitors realtime subscriptions
- Circuit breaker (5 failures → 30s cooldown)
- Debug mode toggle via `VITE_DEBUG_SUPABASE=true`

### ✅ No Polling Found
- Searched for `setInterval` - only found in loading animations and debug stats (1-minute interval)
- No aggressive polling patterns

---

## Files Changed

| File | Changes |
|------|---------|
| `utils/supabaseClient.ts` | Singleton guard, debug mode, instance counting |
| `utils/supabaseDebug.ts` | **NEW** - Debug/instrumentation module |
| `utils/analyticsBuffer.ts` | **NEW** - Buffered analytics writes |
| `contexts/AuthContext.tsx` | Auth listener tracking, reduced console noise |
| `contexts/GalleryContext.tsx` | DB call logging |
| `components/ProfilePage.tsx` | Fixed useEffect dependency |
| `components/AdminDashboard.tsx` | Fixed useEffect dependency |
| `services/promptService.ts` | Circuit breaker, buffered writes, logging |
| `services/userPromptUsageService.ts` | Buffered writes, logging |
| `services/adminService.ts` | DB call logging |

---

## Environment Variables Added

```env
# Enable debug logging for Supabase operations
VITE_DEBUG_SUPABASE=true

# Disable analytics writes (useful for dev/testing)
VITE_DISABLE_ANALYTICS=true
```

---

## Verification Checklist

### Pre-Test Setup
1. Add `VITE_DEBUG_SUPABASE=true` to `.env.local` for detailed logging
2. Open browser DevTools → Network tab (filter: `fetch` or `XHR`)
3. Open browser DevTools → Console (filter: `[Supabase]` or `📊`)

### Test Procedure

#### 1. Initial Load Test
- [ ] Open app fresh (incognito/clear cache)
- [ ] Check console for `🔧 [Supabase] Creating singleton client instance` (should appear ONCE)
- [ ] Check network for initial DB requests (should be minimal)

#### 2. Auth Flow Test
- [ ] Login with Google/email
- [ ] Check console for `🔐 Auth: Setting up subscription...` (should appear ONCE)
- [ ] Logout
- [ ] Check console for `🔐 Auth: Cleaning up subscription` 
- [ ] Login again
- [ ] Verify no "Multiple auth listeners detected" warning

#### 3. Generation Test (Critical)
- [ ] Upload an image
- [ ] Apply a style filter
- [ ] Check console - should see `📊 Queueing prompt usage` and `📊 Queueing generation count increment`
- [ ] Wait 5+ seconds, check console for `📊 [Analytics] Flushing X events`
- [ ] Apply 5 more filters rapidly
- [ ] Verify events are batched (not 5 separate flushes)

#### 4. Profile Page Test
- [ ] Open Profile page
- [ ] Check network - should see 2 requests (getUserPromptUsage, getTotalPromptUsage)
- [ ] Close and reopen Profile page
- [ ] Verify NO new network requests (data is cached per user session)

#### 5. Admin Dashboard Test (if applicable)
- [ ] Navigate to `?page=admin`
- [ ] Check network - should see 1-2 requests
- [ ] Navigate away and back
- [ ] Verify NO new requests on return

#### 6. Stress Test
- [ ] Generate 10 images rapidly
- [ ] Check network tab - should NOT see 10+ immediate DB writes
- [ ] Check console for buffered flush messages
- [ ] Monitor Supabase dashboard for connection count (should stay stable)

#### 7. Circuit Breaker Test (Optional)
- [ ] Temporarily disable network or use Supabase pause
- [ ] Attempt operations
- [ ] Check console for `🚫 Circuit breaker OPEN` messages
- [ ] Verify app doesn't spam retry requests

### DevTools Verification Points

**Network Tab:**
- No repeated identical requests
- No increasing request count over time
- Stable WebSocket connections (0-1 active)

**Console (with debug mode):**
- `📊 [Supabase Debug] DB calls in last minute:` summary every 60s
- No "Multiple auth listeners detected" warnings
- No excessive error logs

**Supabase Dashboard:**
- Stable connection count
- No CPU/memory spikes
- Normal request rate

---

## Rollback Instructions

If issues occur, revert changes to these files:
1. `utils/supabaseClient.ts`
2. `contexts/AuthContext.tsx`
3. `components/ProfilePage.tsx`
4. `components/AdminDashboard.tsx`
5. `services/promptService.ts`
6. `services/userPromptUsageService.ts`

And delete:
1. `utils/supabaseDebug.ts`
2. `utils/analyticsBuffer.ts`

---

## Performance Metrics (Expected Improvements)

| Metric | Before | After |
|--------|--------|-------|
| DB writes per generation | 2-4 immediate | 0 immediate, batched every 5s |
| Auth listeners active | 1 (but re-created on user change) | 1 (stable) |
| DB calls on Profile open | 2 every open | 2 first open, 0 subsequent |
| Retry behavior on failure | Unlimited | Circuit breaker after 5 failures |
| Observability | None | Full debug mode available |

---

## Future Recommendations

1. **Add server-side rate limiting** - Supabase RLS or Edge Functions
2. **Implement optimistic updates** - Already done for favorites, expand to other operations
3. **Add connection pooling metrics** - Monitor from Supabase dashboard
4. **Consider edge caching** - For prompts that rarely change
