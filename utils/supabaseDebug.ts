/**
 * Supabase Debug & Instrumentation Module
 * Provides observability for Supabase operations to detect performance issues
 */

// Debug mode flag - set via env variable
const DEBUG_SUPABASE = typeof import.meta !== 'undefined' 
  ? (import.meta as any).env?.VITE_DEBUG_SUPABASE === 'true'
  : false;

// Circuit breaker configuration
const CIRCUIT_BREAKER_THRESHOLD = 5; // failures before circuit opens
const CIRCUIT_BREAKER_RESET_MS = 30000; // 30 seconds before retry

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

interface DebugStats {
  dbCallsPerMinute: Map<string, number>;
  activeAuthListeners: number;
  activeRealtimeChannels: number;
  lastReset: number;
  circuitBreakers: Map<string, CircuitBreakerState>;
}

// Global debug stats
const debugStats: DebugStats = {
  dbCallsPerMinute: new Map(),
  activeAuthListeners: 0,
  activeRealtimeChannels: 0,
  lastReset: Date.now(),
  circuitBreakers: new Map(),
};

// Reset stats every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (DEBUG_SUPABASE) {
      const now = Date.now();
      const elapsed = (now - debugStats.lastReset) / 1000;
      
      if (debugStats.dbCallsPerMinute.size > 0) {
        console.log('📊 [Supabase Debug] DB calls in last minute:');
        debugStats.dbCallsPerMinute.forEach((count, table) => {
          console.log(`   ${table}: ${count} calls (${(count / elapsed * 60).toFixed(1)}/min)`);
        });
      }
      
      console.log(`📊 [Supabase Debug] Active auth listeners: ${debugStats.activeAuthListeners}`);
      console.log(`📊 [Supabase Debug] Active realtime channels: ${debugStats.activeRealtimeChannels}`);
    }
    
    debugStats.dbCallsPerMinute.clear();
    debugStats.lastReset = Date.now();
  }, 60000);
}

/**
 * Log a database call for tracking
 */
export function logDbCall(table: string, operation: string): void {
  const key = `${table}.${operation}`;
  const current = debugStats.dbCallsPerMinute.get(key) || 0;
  debugStats.dbCallsPerMinute.set(key, current + 1);
  
  if (DEBUG_SUPABASE) {
    console.log(`🔍 [Supabase] ${operation} on ${table}`);
  }
}

/**
 * Track auth listener registration
 */
export function trackAuthListener(action: 'add' | 'remove'): void {
  if (action === 'add') {
    debugStats.activeAuthListeners++;
  } else {
    debugStats.activeAuthListeners = Math.max(0, debugStats.activeAuthListeners - 1);
  }
  
  if (DEBUG_SUPABASE) {
    console.log(`🔐 [Supabase] Auth listener ${action}ed. Active: ${debugStats.activeAuthListeners}`);
  }
  
  // Warn if multiple auth listeners detected
  if (debugStats.activeAuthListeners > 1) {
    console.warn(`⚠️ [Supabase] Multiple auth listeners detected (${debugStats.activeAuthListeners})! This may cause issues.`);
  }
}

/**
 * Track realtime channel subscription
 */
export function trackRealtimeChannel(action: 'subscribe' | 'unsubscribe', channelName?: string): void {
  if (action === 'subscribe') {
    debugStats.activeRealtimeChannels++;
  } else {
    debugStats.activeRealtimeChannels = Math.max(0, debugStats.activeRealtimeChannels - 1);
  }
  
  if (DEBUG_SUPABASE) {
    console.log(`📡 [Supabase] Channel ${channelName || 'unknown'} ${action}d. Active: ${debugStats.activeRealtimeChannels}`);
  }
}

/**
 * Circuit breaker for repeated failures
 * Returns true if the circuit is open (should NOT make the request)
 */
export function isCircuitOpen(key: string): boolean {
  const state = debugStats.circuitBreakers.get(key);
  
  if (!state) return false;
  
  if (state.isOpen) {
    // Check if we should try again
    if (Date.now() - state.lastFailure > CIRCUIT_BREAKER_RESET_MS) {
      state.isOpen = false;
      state.failures = 0;
      if (DEBUG_SUPABASE) {
        console.log(`🔄 [Supabase] Circuit breaker reset for ${key}`);
      }
      return false;
    }
    return true;
  }
  
  return false;
}

/**
 * Record a failure for circuit breaker
 */
export function recordFailure(key: string): void {
  let state = debugStats.circuitBreakers.get(key);
  
  if (!state) {
    state = { failures: 0, lastFailure: 0, isOpen: false };
    debugStats.circuitBreakers.set(key, state);
  }
  
  state.failures++;
  state.lastFailure = Date.now();
  
  if (state.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    state.isOpen = true;
    console.warn(`🚫 [Supabase] Circuit breaker OPEN for ${key} after ${state.failures} failures. Will retry in ${CIRCUIT_BREAKER_RESET_MS / 1000}s`);
  }
}

/**
 * Record a success (resets circuit breaker)
 */
export function recordSuccess(key: string): void {
  const state = debugStats.circuitBreakers.get(key);
  if (state) {
    state.failures = 0;
    state.isOpen = false;
  }
}

/**
 * Get current debug stats (for dev tools / admin dashboard)
 */
export function getDebugStats(): {
  dbCallsPerMinute: Record<string, number>;
  activeAuthListeners: number;
  activeRealtimeChannels: number;
  openCircuits: string[];
} {
  return {
    dbCallsPerMinute: Object.fromEntries(debugStats.dbCallsPerMinute),
    activeAuthListeners: debugStats.activeAuthListeners,
    activeRealtimeChannels: debugStats.activeRealtimeChannels,
    openCircuits: Array.from(debugStats.circuitBreakers.entries())
      .filter(([_, state]) => state.isOpen)
      .map(([key]) => key),
  };
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
  return DEBUG_SUPABASE;
}
