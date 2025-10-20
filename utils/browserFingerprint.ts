/**
 * Browser Fingerprinting Utility
 * Generates a unique anonymous ID for each browser/device
 * Used to prevent duplicate votes without requiring user login
 */

const BROWSER_ID_KEY = 'aiImageStylizer_browserId';

/**
 * Generate a simple hash from a string
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Collect browser fingerprint data
 */
function collectFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform,
  ];
  
  return components.join('|');
}

/**
 * Get or create a unique browser ID
 * First checks localStorage, then generates a new one if needed
 */
export function getBrowserId(): string {
  // Try to get existing ID from localStorage
  let browserId = localStorage.getItem(BROWSER_ID_KEY);
  
  if (browserId) {
    return browserId;
  }
  
  // Generate new ID based on browser fingerprint + random component
  const fingerprint = collectFingerprint();
  const randomComponent = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  
  browserId = `${simpleHash(fingerprint)}-${timestamp}-${randomComponent}`;
  
  // Store for future use
  try {
    localStorage.setItem(BROWSER_ID_KEY, browserId);
  } catch (error) {
    console.error('Error storing browser ID:', error);
  }
  
  return browserId;
}

/**
 * Clear the stored browser ID (for testing)
 */
export function clearBrowserId(): void {
  localStorage.removeItem(BROWSER_ID_KEY);
}
