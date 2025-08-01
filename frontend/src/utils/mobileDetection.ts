/**
 * Mobile Detection Utilities
 * Provides reliable mobile device detection and theme application
 */

export interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  hasTouch: boolean;
  screenWidth: number;
  userAgent: string;
}

/**
 * Detects if the current device is mobile
 */
export const detectMobile = (): MobileDetectionResult => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const screenWidth = window.innerWidth;
  
  // Check for mobile user agents
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUserAgent = mobileRegex.test(userAgent);
  
  // Check for tablet user agents
  const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet/i;
  const isTabletUserAgent = tabletRegex.test(userAgent);
  
  // Check for touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Consider it mobile if screen width is below 768px OR has mobile user agent
  const isMobile = screenWidth < 768 || (isMobileUserAgent && !isTabletUserAgent);
  
  return {
    isMobile,
    isTablet: isTabletUserAgent,
    hasTouch,
    screenWidth,
    userAgent
  };
};

/**
 * Applies mobile-specific classes to the form container
 */
export const applyMobileTheme = (
  containerElement: HTMLElement | null,
  forceDarkTheme: boolean = true
): void => {
  if (!containerElement) return;
  
  const { isMobile, hasTouch } = detectMobile();
  
  // Remove existing mobile classes
  containerElement.classList.remove('is-mobile-device', 'has-touch', 'mobile-dark');
  
  if (isMobile) {
    containerElement.classList.add('is-mobile-device');
    
    if (forceDarkTheme) {
      containerElement.classList.add('mobile-dark');
    }
  }
  
  if (hasTouch) {
    containerElement.classList.add('has-touch');
  }
};

/**
 * Creates mobile status bar HTML
 */
export const createMobileStatusBar = (): string => {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false
  });
  
  return `
    <div class="mobile-header">
      <div class="time">${timeString}</div>
      <div class="carrier">Instagram</div>
      <div class="status-icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="white">
          <rect x="0" y="8" width="3" height="4" rx="0.5"/>
          <rect x="5" y="6" width="3" height="6" rx="0.5"/>
          <rect x="10" y="4" width="3" height="8" rx="0.5"/>
          <rect x="15" y="0" width="3" height="12" rx="0.5"/>
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
          <path d="M1 4 Q8 -2 15 4" stroke="white" stroke-width="1.5" fill="none"/>
          <path d="M3 7 Q8 2 13 7" stroke="white" stroke-width="1.5" fill="none"/>
          <path d="M5 10 Q8 6 11 10" stroke="white" stroke-width="1.5" fill="none"/>
        </svg>
        <svg width="24" height="12" viewBox="0 0 24 12" fill="white">
          <rect x="0" y="2" width="20" height="8" rx="2" stroke="white" fill="none"/>
          <rect x="21" y="5" width="2" height="2" rx="0.5" fill="white"/>
          <rect x="2" y="4" width="16" height="4" rx="1" fill="white"/>
        </svg>
      </div>
    </div>
  `;
};

/**
 * Creates mobile form title bar
 */
export const createMobileFormTitle = (title: string = 'JOURNAL'): string => {
  return `
    <div class="mobile-form-title">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="white" style="margin-right: 8px;">
        <path d="M10 0 L3 7 L7 7 L7 20 L13 20 L13 7 L17 7 Z" transform="rotate(180 10 10)"/>
      </svg>
      <span>${title}</span>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="white" style="margin-left: 8px;">
        <path d="M5 7 L10 2 L15 7 M10 2 L10 18"/>
      </svg>
    </div>
  `;
};

/**
 * Hook for React components to detect mobile
 */
export const useMobileDetection = () => {
  const [mobileInfo, setMobileInfo] = React.useState<MobileDetectionResult>(detectMobile());
  
  React.useEffect(() => {
    const handleResize = () => {
      setMobileInfo(detectMobile());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return mobileInfo;
};

/**
 * Adds viewport meta tag for proper mobile rendering
 */
export const ensureViewportMeta = (): void => {
  let viewport = document.querySelector('meta[name="viewport"]');
  
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }
  
  viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
};

/**
 * Import React for the hook
 */
import * as React from 'react';