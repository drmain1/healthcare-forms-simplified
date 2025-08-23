// Debug Logger utility that works in production builds
// React's production build removes console.log statements, so we use alternative methods

interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

class DebugLogger {
  private logs: DebugLog[] = [];
  private maxLogs = 100;
  private enabled = true;

  constructor() {
    // Check if debug mode is enabled via environment or localStorage
    const envDebug = process.env.REACT_APP_DEBUG === 'true';
    const localDebug = localStorage.getItem('debug_mode') === 'true';
    this.enabled = envDebug || localDebug;

    // Expose debug functions globally for production debugging
    if (typeof window !== 'undefined') {
      (window as any).__debugLogger = this;
      (window as any).__enableDebug = () => this.enable();
      (window as any).__disableDebug = () => this.disable();
      (window as any).__getLogs = () => this.getLogs();
      (window as any).__clearLogs = () => this.clearLogs();
      (window as any).__debugCSRF = () => this.debugCSRF();
    }
  }

  private addLog(level: DebugLog['level'], message: string, data?: any) {
    if (!this.enabled) return;

    const log: DebugLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    this.logs.push(log);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('debug_logs', JSON.stringify(this.logs));
    } catch (e) {
      // Ignore localStorage errors (quota exceeded, etc.)
    }

    // Also output to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' ? console.error : 
                           level === 'warn' ? console.warn : 
                           console.log;
      consoleMethod(`[${level.toUpperCase()}] ${message}`, data || '');
    }
  }

  info(message: string, data?: any) {
    this.addLog('info', message, data);
  }

  warn(message: string, data?: any) {
    this.addLog('warn', message, data);
  }

  error(message: string, data?: any) {
    this.addLog('error', message, data);
  }

  debug(message: string, data?: any) {
    this.addLog('debug', message, data);
  }

  enable() {
    this.enabled = true;
    localStorage.setItem('debug_mode', 'true');
    this.info('Debug mode enabled');
  }

  disable() {
    this.enabled = false;
    localStorage.removeItem('debug_mode');
    this.info('Debug mode disabled');
  }

  getLogs(): DebugLog[] {
    // Try to get logs from localStorage first
    try {
      const stored = localStorage.getItem('debug_logs');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('debug_logs');
  }

  // Special method to debug CSRF token issues
  debugCSRF() {
    const cookies = document.cookie;
    const csrfCookie = cookies.split(';').find(c => c.trim().startsWith('csrf_token='));
    const hasToken = !!csrfCookie;
    const tokenValue = hasToken ? csrfCookie.split('=')[1] : null;

    const debugInfo = {
      hasCSRFCookie: hasToken,
      csrfToken: tokenValue ? `${tokenValue.substring(0, 8)}...` : null,
      allCookies: cookies.split(';').map(c => c.trim().split('=')[0]),
      currentURL: window.location.href,
      apiURL: process.env.REACT_APP_API_URL || 'not set',
      timestamp: new Date().toISOString()
    };

    this.info('CSRF Debug Info', debugInfo);
    
    // Also create a visible debug panel
    this.showDebugPanel(debugInfo);
    
    return debugInfo;
  }

  // Show a visible debug panel on the page
  private showDebugPanel(data: any) {
    const existingPanel = document.getElementById('debug-panel');
    if (existingPanel) {
      existingPanel.remove();
    }

    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      max-width: 400px;
      max-height: 300px;
      overflow: auto;
      z-index: 99999;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    `;

    panel.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; color: #ffff00;">
        🔍 CSRF Debug Panel
        <button onclick="document.getElementById('debug-panel').remove()" 
                style="float: right; background: red; color: white; border: none; 
                       padding: 2px 8px; border-radius: 4px; cursor: pointer;">✕</button>
      </div>
      <pre style="margin: 0; color: #00ff00;">${JSON.stringify(data, null, 2)}</pre>
    `;

    document.body.appendChild(panel);

    // Auto-remove after 30 seconds
    setTimeout(() => {
      const p = document.getElementById('debug-panel');
      if (p) p.remove();
    }, 30000);
  }
}

// Create singleton instance
const debugLogger = new DebugLogger();

// Export both the instance and the class
export { debugLogger, DebugLogger };
export default debugLogger;

// Instructions for use in production:
// 1. Open browser console
// 2. Type: __enableDebug() to enable debug logging
// 3. Type: __debugCSRF() to see CSRF token status
// 4. Type: __getLogs() to see all debug logs
// 5. Type: __clearLogs() to clear debug logs