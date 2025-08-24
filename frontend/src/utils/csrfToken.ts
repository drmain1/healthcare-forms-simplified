// CSRF Token management utility - Redis-based Phase 3 implementation
import debugLogger from './debugLogger';

// Get CSRF token from sessionStorage (new Redis-based approach)
export function getCSRFToken(): string | null {
  const token = sessionStorage.getItem('csrfToken');
  if (token) {
    debugLogger.debug('[getCSRFToken] Using token from sessionStorage');
    return token;
  }
  
  debugLogger.warn('[getCSRFToken] CSRF token not found in sessionStorage');
  return null;
}

// Set CSRF token in sessionStorage (called after login)
export function setCSRFToken(token: string): void {
  sessionStorage.setItem('csrfToken', token);
  debugLogger.info('[setCSRFToken] CSRF token stored in sessionStorage');
}

// Clear CSRF token (called on logout)
export function clearCSRFToken(): void {
  sessionStorage.removeItem('csrfToken');
  debugLogger.info('[clearCSRFToken] CSRF token cleared from sessionStorage');
}

// Fetch CSRF token from backend (standalone - not used in login flow)
export async function fetchCSRFToken(): Promise<string | null> {
  try {
    // Handle Firebase Hosting rewrites - in production, don't double the /api prefix
    const apiUrl = process.env.REACT_APP_API_URL === '' ? '/api' : (process.env.REACT_APP_API_URL || 'http://localhost:8080/api');
    const url = `${apiUrl}/auth/csrf-token`;
    debugLogger.info('Fetching standalone CSRF token from:', { url });
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      debugLogger.info('Standalone CSRF token received', { hasToken: !!data.csrfToken });
      
      if (data.csrfToken) {
        setCSRFToken(data.csrfToken);
      }
      
      return data.csrfToken || null;
    } else {
      debugLogger.error('Standalone CSRF token fetch failed', { status: response.status, statusText: response.statusText });
    }
  } catch (error) {
    debugLogger.error('Failed to fetch standalone CSRF token', error);
  }
  return null;
}

// Ensure CSRF token exists (fallback - login should provide token)
export async function ensureCSRFToken(): Promise<string | null> {
  let token = getCSRFToken();
  
  if (!token) {
    debugLogger.warn('[ensureCSRFToken] No CSRF token found, fetching from server');
    await fetchCSRFToken();
    token = getCSRFToken();
  }
  
  return token;
}