// CSRF Token management utility
import debugLogger from './debugLogger';

// Store token in memory for Firebase Hosting (cookies don't work through proxy)
let csrfTokenInMemory: string | null = null;

// Get CSRF token from cookie or memory
export function getCSRFToken(): string | null {
  // First check memory (for Firebase Hosting)
  if (csrfTokenInMemory) {
    debugLogger.debug('[getCSRFToken] Using token from memory');
    return csrfTokenInMemory;
  }
  
  // Then check cookie (for local development)
  const name = 'csrf_token=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  
  debugLogger.debug('[getCSRFToken] Looking for csrf_token in cookies', { cookies: decodedCookie });
  
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      const token = cookie.substring(name.length);
      debugLogger.info('[getCSRFToken] Found CSRF token', { token: token.substring(0, 8) + '...' });
      return token;
    }
  }
  debugLogger.warn('[getCSRFToken] CSRF token not found in cookies or memory');
  return null;
}

// Helper function to get CSRF token only from cookie
function getCSRFTokenFromCookie(): string | null {
  const name = 'csrf_token=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      const token = cookie.substring(name.length);
      return token;
    }
  }
  return null;
}

// Fetch CSRF token from backend
export async function fetchCSRFToken(): Promise<string | null> {
  try {
    // Handle Firebase Hosting rewrites - in production, don't double the /api prefix
    const apiUrl = process.env.REACT_APP_API_URL === '' ? '/api' : (process.env.REACT_APP_API_URL || 'http://localhost:8080/api');
    const url = `${apiUrl}/auth/csrf-token`;
    debugLogger.info('Fetching CSRF token from:', { url });
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      debugLogger.info('CSRF token received', { hasToken: !!data.csrfToken });
      
      // Store token in memory for Firebase Hosting
      if (data.csrfToken) {
        csrfTokenInMemory = data.csrfToken;
        debugLogger.info('CSRF token stored in memory for Firebase Hosting');
      }
      
      // Check if cookie was set (works in local dev)
      const tokenFromCookie = getCSRFTokenFromCookie();
      debugLogger.info('CSRF token in cookie after fetch', { hasToken: !!tokenFromCookie });
      
      return data.csrfToken || null;
    } else {
      debugLogger.error('CSRF token fetch failed', { status: response.status, statusText: response.statusText });
    }
  } catch (error) {
    debugLogger.error('Failed to fetch CSRF token', error);
  }
  return null;
}

// Ensure CSRF token exists
export async function ensureCSRFToken(): Promise<string | null> {
  let token = getCSRFToken();
  
  if (!token) {
    // Fetch a new token if none exists
    await fetchCSRFToken();
    token = getCSRFToken();
  }
  
  return token;
}