/**
 * Mobile Theme Diagnostics Tool
 * Helps identify why mobile dark theme isn't applying correctly
 */

export interface DiagnosticResult {
  test: string;
  passed: boolean;
  details: any;
  message: string;
}

export class MobileThemeDiagnostics {
  private results: DiagnosticResult[] = [];
  
  /**
   * Run all diagnostic tests
   */
  async runAllTests(): Promise<DiagnosticResult[]> {
    this.results = [];
    
    // Test 1: Check if mobile-dark-theme.css is loaded
    this.testCSSFileLoaded();
    
    // Test 2: Check if mobile detection is working
    this.testMobileDetection();
    
    // Test 3: Check if correct classes are applied
    this.testClassesApplied();
    
    // Test 4: Check CSS variable overrides
    this.testCSSVariables();
    
    // Test 5: Check for conflicting styles
    this.testConflictingStyles();
    
    // Test 6: Check SurveyJS theme conflicts
    this.testSurveyJSThemes();
    
    // Test 7: Check computed styles on specific elements
    this.testComputedStyles();
    
    // Test 8: Check media query application
    this.testMediaQueries();
    
    return this.results;
  }
  
  /**
   * Test 1: Check if CSS file is loaded
   */
  private testCSSFileLoaded() {
    const stylesheets = Array.from(document.styleSheets);
    const mobileThemeLoaded = stylesheets.some(sheet => {
      try {
        return sheet.href?.includes('mobile-dark-theme.css');
      } catch (e) {
        return false;
      }
    });
    
    this.results.push({
      test: 'CSS File Loaded',
      passed: mobileThemeLoaded,
      details: {
        totalStylesheets: stylesheets.length,
        stylesheetUrls: stylesheets.map(s => s.href).filter(Boolean)
      },
      message: mobileThemeLoaded 
        ? 'mobile-dark-theme.css is loaded' 
        : 'mobile-dark-theme.css is NOT loaded'
    });
  }
  
  /**
   * Test 2: Check mobile detection
   */
  private testMobileDetection() {
    const screenWidth = window.innerWidth;
    const userAgent = navigator.userAgent;
    const isMobileWidth = screenWidth < 768;
    const isMobileUA = /iPhone|iPad|Android/i.test(userAgent);
    
    this.results.push({
      test: 'Mobile Detection',
      passed: isMobileWidth || isMobileUA,
      details: {
        screenWidth,
        userAgent,
        isMobileWidth,
        isMobileUA
      },
      message: `Screen: ${screenWidth}px, Mobile: ${isMobileWidth || isMobileUA}`
    });
  }
  
  /**
   * Test 3: Check classes applied
   */
  private testClassesApplied() {
    const formContainer = document.querySelector('.patient-form-view');
    const hasPatientClass = formContainer?.classList.contains('patient-form-view') || false;
    const hasMobileDark = formContainer?.classList.contains('mobile-dark') || false;
    
    this.results.push({
      test: 'CSS Classes Applied',
      passed: hasPatientClass && hasMobileDark,
      details: {
        foundContainer: !!formContainer,
        classes: formContainer?.className,
        hasPatientClass,
        hasMobileDark
      },
      message: hasMobileDark 
        ? 'mobile-dark class is applied' 
        : 'mobile-dark class is MISSING'
    });
  }
  
  /**
   * Test 4: Check CSS variables
   */
  private testCSSVariables() {
    const container = document.querySelector('.patient-form-view.mobile-dark');
    if (!container) {
      this.results.push({
        test: 'CSS Variables',
        passed: false,
        details: { error: 'Container not found' },
        message: 'Cannot test - container not found'
      });
      return;
    }
    
    const computedStyle = getComputedStyle(container as Element);
    const bgColor = computedStyle.getPropertyValue('--sjs-general-backcolor');
    const bgColorDim = computedStyle.getPropertyValue('--sjs-general-backcolor-dim');
    
    this.results.push({
      test: 'CSS Variables',
      passed: bgColor === 'transparent' || bgColor.includes('transparent'),
      details: {
        '--sjs-general-backcolor': bgColor,
        '--sjs-general-backcolor-dim': bgColorDim,
        background: computedStyle.background
      },
      message: bgColor === 'transparent' 
        ? 'CSS variables are overridden correctly' 
        : `CSS variables NOT overridden: ${bgColor}`
    });
  }
  
  /**
   * Test 5: Check for conflicting styles
   */
  private testConflictingStyles() {
    const surveyElements = document.querySelectorAll('.sd-body, .sv-body, .sd-question, .sv-question');
    const conflicts: any[] = [];
    
    surveyElements.forEach(el => {
      const computed = getComputedStyle(el);
      const bg = computed.backgroundColor;
      const bgImage = computed.backgroundImage;
      
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
        conflicts.push({
          element: el.className,
          backgroundColor: bg,
          backgroundImage: bgImage
        });
      }
    });
    
    this.results.push({
      test: 'Style Conflicts',
      passed: conflicts.length === 0,
      details: { conflicts },
      message: conflicts.length === 0 
        ? 'No conflicting backgrounds found' 
        : `Found ${conflicts.length} elements with non-transparent backgrounds`
    });
  }
  
  /**
   * Test 6: Check SurveyJS theme
   */
  private testSurveyJSThemes() {
    const surveyRoot = document.querySelector('.sd-root-modern, .sv-root-modern');
    const surveyThemeApplied = !!surveyRoot;
    
    // Check for theme-specific classes
    const themeClasses = [
      'sd-theme--layered',
      'sd-theme--panelless', 
      'sd-theme--lightweight',
      'sd-theme--plain'
    ];
    
    const appliedTheme = themeClasses.find(cls => 
      surveyRoot?.classList.contains(cls)
    );
    
    this.results.push({
      test: 'SurveyJS Theme',
      passed: surveyThemeApplied,
      details: {
        surveyRoot: !!surveyRoot,
        appliedTheme,
        rootClasses: surveyRoot?.className
      },
      message: appliedTheme 
        ? `SurveyJS theme: ${appliedTheme}` 
        : 'No specific SurveyJS theme detected'
    });
  }
  
  /**
   * Test 7: Check computed styles
   */
  private testComputedStyles() {
    const testElements = [
      { selector: '.patient-form-view.mobile-dark', name: 'Container' },
      { selector: '.sd-body, .sv-body', name: 'Survey Body' },
      { selector: '.sd-question:first-of-type', name: 'First Question' },
      { selector: '.sd-panel:first-of-type', name: 'First Panel' }
    ];
    
    const computedResults: any[] = [];
    
    testElements.forEach(({ selector, name }) => {
      const el = document.querySelector(selector);
      if (el) {
        const computed = getComputedStyle(el);
        computedResults.push({
          element: name,
          background: computed.background,
          backgroundColor: computed.backgroundColor,
          color: computed.color
        });
      }
    });
    
    const hasGradient = computedResults.some(r => 
      r.background?.includes('gradient')
    );
    
    this.results.push({
      test: 'Computed Styles',
      passed: hasGradient,
      details: computedResults,
      message: hasGradient 
        ? 'Gradient background is applied' 
        : 'Gradient background NOT found'
    });
  }
  
  /**
   * Test 8: Check media queries
   */
  private testMediaQueries() {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const matches = mediaQuery.matches;
    
    this.results.push({
      test: 'Media Query',
      passed: matches,
      details: {
        query: '(max-width: 768px)',
        matches,
        screenWidth: window.innerWidth
      },
      message: matches 
        ? 'Mobile media query is active' 
        : 'Mobile media query is NOT active'
    });
  }
  
  /**
   * Log results to console with formatting
   */
  logResults() {
    // Results logging disabled for production
  }
  
  /**
   * Get specific element diagnostics
   */
  getElementDiagnostics(selector: string) {
    const element = document.querySelector(selector);
    if (!element) {
      return { error: 'Element not found' };
    }
    
    const computed = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    return {
      selector,
      classes: element.className,
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      },
      styles: {
        background: computed.background,
        backgroundColor: computed.backgroundColor,
        backgroundImage: computed.backgroundImage,
        color: computed.color,
        display: computed.display,
        opacity: computed.opacity,
        zIndex: computed.zIndex
      },
      cssVariables: {
        '--sjs-general-backcolor': computed.getPropertyValue('--sjs-general-backcolor'),
        '--sjs-general-backcolor-dim': computed.getPropertyValue('--sjs-general-backcolor-dim')
      }
    };
  }
  
  /**
   * Create visual overlay showing which elements have backgrounds
   */
  createVisualDebugOverlay() {
    // Remove existing overlay
    document.getElementById('mobile-theme-debug-overlay')?.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'mobile-theme-debug-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 9999;
    `;
    
    // Find all elements with non-transparent backgrounds
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const computed = getComputedStyle(el);
      const bg = computed.backgroundColor;
      
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)' && 
          el.closest('.patient-form-view.mobile-dark')) {
        const rect = el.getBoundingClientRect();
        const marker = document.createElement('div');
        marker.style.cssText = `
          position: absolute;
          top: ${rect.top}px;
          left: ${rect.left}px;
          width: ${rect.width}px;
          height: ${rect.height}px;
          border: 2px solid red;
          background: rgba(255, 0, 0, 0.1);
        `;
        marker.title = `${el.tagName}.${el.className}: ${bg}`;
        overlay.appendChild(marker);
      }
    });
    
    document.body.appendChild(overlay);
    
    // Auto-remove after 5 seconds
    setTimeout(() => overlay.remove(), 5000);
  }
}

// Export a ready-to-use instance
export const mobileDiagnostics = new MobileThemeDiagnostics();

// Add to window for console access
if (typeof window !== 'undefined') {
  (window as any).mobileDiagnostics = mobileDiagnostics;
}