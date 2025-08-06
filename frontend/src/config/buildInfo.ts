// Build information for tracking deployments
export const BUILD_INFO = {
  // These will be replaced by environment variables during build
  timestamp: process.env.REACT_APP_BUILD_TIMESTAMP || 'development',
  version: process.env.REACT_APP_BUILD_VERSION || 'local',
  commitHash: process.env.REACT_APP_COMMIT_HASH || 'unknown',
  apiUrl: process.env.REACT_APP_API_URL || 'not-set',
  environment: process.env.NODE_ENV || 'development',
};

// Log build info to console with styling
export const logBuildInfo = () => {
  const buildDate = BUILD_INFO.timestamp === 'development' 
    ? 'Development Build' 
    : new Date(BUILD_INFO.timestamp).toLocaleString();

  console.group(
    '%c🏗️ Healthcare Forms Build Info',
    'background: #1976d2; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
  );
  console.log('%c📅 Build Time:', 'font-weight: bold;', buildDate);
  console.log('%c📌 Version:', 'font-weight: bold;', BUILD_INFO.version);
  console.log('%c🔨 Commit:', 'font-weight: bold;', BUILD_INFO.commitHash);
  console.log('%c🌐 API URL:', 'font-weight: bold;', BUILD_INFO.apiUrl);
  console.log('%c🚀 Environment:', 'font-weight: bold;', BUILD_INFO.environment);
  console.groupEnd();

  // Also add a global object for easy access in browser console
  (window as any).__BUILD_INFO__ = BUILD_INFO;
  
};