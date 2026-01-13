/**
 * Responsive Breakpoint Constants and Utilities
 * 
 * Implements the Progressive Disclosure architecture with three distinct interaction modes:
 * - Desktop (≥1200px): Full-featured management interface
 * - Tablet (768px-1199px): Streamlined review interface  
 * - Mobile (≤767px): Monitoring and quick action interface
 */

export const BREAKPOINTS = {
  mobile: { max: 767 },
  tablet: { min: 768, max: 1199 },
  desktop: { min: 1200 }
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * CSS Media Query strings for responsive design
 */
export const MEDIA_QUERIES = {
  mobile: `(max-width: ${BREAKPOINTS.mobile.max}px)`,
  tablet: `(min-width: ${BREAKPOINTS.tablet.min}px) and (max-width: ${BREAKPOINTS.tablet.max}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop.min}px)`,
  tabletAndUp: `(min-width: ${BREAKPOINTS.tablet.min}px)`,
  mobileAndTablet: `(max-width: ${BREAKPOINTS.tablet.max}px)`
} as const;

/**
 * Utility function to get current breakpoint from window width
 */
export function getBreakpointFromWidth(width: number): Breakpoint {
  if (width <= BREAKPOINTS.mobile.max) {
    return 'mobile';
  }
  if (width >= BREAKPOINTS.tablet.min && width <= BREAKPOINTS.tablet.max) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * Check if current width matches a specific breakpoint
 */
export function isBreakpoint(width: number, breakpoint: Breakpoint): boolean {
  switch (breakpoint) {
    case 'mobile':
      return width <= BREAKPOINTS.mobile.max;
    case 'tablet':
      return width >= BREAKPOINTS.tablet.min && width <= BREAKPOINTS.tablet.max;
    case 'desktop':
      return width >= BREAKPOINTS.desktop.min;
    default:
      return false;
  }
}

/**
 * Device purpose mapping for each breakpoint
 */
export const DEVICE_PURPOSE = {
  mobile: 'monitor', // Monitoring and quick actions
  tablet: 'review',  // Review and basic QC tasks
  desktop: 'manage'  // Full management and configuration
} as const;

/**
 * Interaction mode capabilities for each breakpoint
 */
export const INTERACTION_CAPABILITIES = {
  mobile: {
    layout: 'single-column',
    navigation: 'bottom-tabs',
    dataDisplay: 'cards',
    advancedFeatures: false,
    touchOptimized: true
  },
  tablet: {
    layout: 'single-column-accordion',
    navigation: 'hamburger-menu',
    dataDisplay: 'condensed-table-or-cards',
    advancedFeatures: 'modal',
    touchOptimized: true
  },
  desktop: {
    layout: 'multi-column',
    navigation: 'fixed-sidebar',
    dataDisplay: 'full-table',
    advancedFeatures: true,
    touchOptimized: false
  }
} as const;