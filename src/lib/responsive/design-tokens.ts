/**
 * Responsive Design Tokens
 * 
 * Implements responsive typography, spacing, and touch targets following the
 * Action > Status > Data > Metadata priority hierarchy.
 * 
 * Key principles:
 * - Never shrink text below 14px, change layout instead
 * - Touch targets minimum 44px on mobile
 * - Proportional spacing across breakpoints
 */

import type { Breakpoint } from './breakpoints';

/**
 * Responsive Typography Tokens
 * Maintains minimum 14px font size across all breakpoints
 */
export const RESPONSIVE_TYPOGRAPHY = {
  heading: {
    desktop: '20px',  // --gh-text-xl (1.25rem)
    tablet: '18px',   // --gh-text-lg (1.125rem) 
    mobile: '18px'    // Never below 18px for headings
  },
  body: {
    desktop: '16px',  // --gh-text-base (1rem)
    tablet: '15px',   // Slightly smaller but readable
    mobile: '15px'    // Never below 15px for body text
  },
  meta: {
    desktop: '14px',  // --gh-text-sm (0.875rem)
    tablet: '14px',   // Maintain readability
    mobile: '14px'    // Minimum allowed size
  },
  caption: {
    desktop: '12px',  // --gh-text-xs (0.75rem) - only for desktop
    tablet: '14px',   // Upgrade to meta size
    mobile: '14px'    // Upgrade to meta size
  }
} as const;

/**
 * Responsive Line Heights
 * Maintains proper text readability across breakpoints
 */
export const RESPONSIVE_LINE_HEIGHTS = {
  heading: {
    desktop: '28px',  // 1.4 ratio
    tablet: '26px',   // 1.44 ratio
    mobile: '26px'
  },
  body: {
    desktop: '24px',  // 1.5 ratio
    tablet: '22px',   // 1.47 ratio
    mobile: '22px'
  },
  meta: {
    desktop: '20px',  // 1.43 ratio
    tablet: '20px',
    mobile: '20px'
  }
} as const;

/**
 * Responsive Spacing Tokens
 * Proportional spacing: Desktop (16-24px), Tablet (12-16px), Mobile (8-12px)
 */
export const RESPONSIVE_SPACING = {
  xs: {
    desktop: '4px',   // --gh-space-1
    tablet: '3px',
    mobile: '2px'
  },
  sm: {
    desktop: '8px',   // --gh-space-2
    tablet: '6px',
    mobile: '4px'
  },
  md: {
    desktop: '12px',  // --gh-space-3
    tablet: '9px',
    mobile: '6px'
  },
  lg: {
    desktop: '16px',  // --gh-space-4
    tablet: '12px',
    mobile: '8px'
  },
  xl: {
    desktop: '20px',  // --gh-space-5
    tablet: '15px',
    mobile: '10px'
  },
  '2xl': {
    desktop: '24px',  // --gh-space-6
    tablet: '18px',
    mobile: '12px'
  },
  '3xl': {
    desktop: '32px',  // --gh-space-8
    tablet: '24px',
    mobile: '16px'
  },
  '4xl': {
    desktop: '40px',  // --gh-space-10
    tablet: '30px',
    mobile: '20px'
  }
} as const;

/**
 * Touch Target Tokens
 * Ensures accessibility compliance across devices
 */
export const TOUCH_TARGETS = {
  minimum: '44px',      // WCAG AA minimum
  comfortable: '48px',  // Recommended size
  large: '56px',        // For primary actions
  desktop: '36px'       // Can be smaller on desktop (mouse precision)
} as const;

/**
 * Responsive Component Sizing
 */
export const RESPONSIVE_COMPONENTS = {
  button: {
    height: {
      desktop: TOUCH_TARGETS.desktop,
      tablet: TOUCH_TARGETS.comfortable,
      mobile: TOUCH_TARGETS.minimum
    },
    padding: {
      desktop: '8px 16px',
      tablet: '10px 16px',
      mobile: '12px 16px'
    }
  },
  input: {
    height: {
      desktop: TOUCH_TARGETS.desktop,
      tablet: TOUCH_TARGETS.comfortable,
      mobile: TOUCH_TARGETS.minimum
    },
    padding: {
      desktop: '8px 12px',
      tablet: '10px 12px',
      mobile: '12px 12px'
    }
  },
  card: {
    padding: {
      desktop: '24px',  // --gh-card-padding-md
      tablet: '16px',   // --gh-card-padding-sm
      mobile: '12px'    // Compact for mobile
    },
    gap: {
      desktop: '16px',
      tablet: '12px',
      mobile: '8px'
    }
  }
} as const;

/**
 * Utility function to get responsive value for current breakpoint
 */
export function getResponsiveValue<T extends Record<Breakpoint, string>>(
  values: T,
  breakpoint: Breakpoint
): string {
  return values[breakpoint];
}

/**
 * Generate CSS custom properties for responsive tokens
 */
export function generateResponsiveTokens(breakpoint: Breakpoint) {
  return {
    // Typography
    '--gh-responsive-heading': getResponsiveValue(RESPONSIVE_TYPOGRAPHY.heading, breakpoint),
    '--gh-responsive-body': getResponsiveValue(RESPONSIVE_TYPOGRAPHY.body, breakpoint),
    '--gh-responsive-meta': getResponsiveValue(RESPONSIVE_TYPOGRAPHY.meta, breakpoint),
    '--gh-responsive-caption': getResponsiveValue(RESPONSIVE_TYPOGRAPHY.caption, breakpoint),
    
    // Line Heights
    '--gh-responsive-heading-lh': getResponsiveValue(RESPONSIVE_LINE_HEIGHTS.heading, breakpoint),
    '--gh-responsive-body-lh': getResponsiveValue(RESPONSIVE_LINE_HEIGHTS.body, breakpoint),
    '--gh-responsive-meta-lh': getResponsiveValue(RESPONSIVE_LINE_HEIGHTS.meta, breakpoint),
    
    // Spacing
    '--gh-responsive-space-xs': getResponsiveValue(RESPONSIVE_SPACING.xs, breakpoint),
    '--gh-responsive-space-sm': getResponsiveValue(RESPONSIVE_SPACING.sm, breakpoint),
    '--gh-responsive-space-md': getResponsiveValue(RESPONSIVE_SPACING.md, breakpoint),
    '--gh-responsive-space-lg': getResponsiveValue(RESPONSIVE_SPACING.lg, breakpoint),
    '--gh-responsive-space-xl': getResponsiveValue(RESPONSIVE_SPACING.xl, breakpoint),
    '--gh-responsive-space-2xl': getResponsiveValue(RESPONSIVE_SPACING['2xl'], breakpoint),
    '--gh-responsive-space-3xl': getResponsiveValue(RESPONSIVE_SPACING['3xl'], breakpoint),
    '--gh-responsive-space-4xl': getResponsiveValue(RESPONSIVE_SPACING['4xl'], breakpoint),
    
    // Component sizing
    '--gh-responsive-button-height': getResponsiveValue(RESPONSIVE_COMPONENTS.button.height, breakpoint),
    '--gh-responsive-button-padding': getResponsiveValue(RESPONSIVE_COMPONENTS.button.padding, breakpoint),
    '--gh-responsive-input-height': getResponsiveValue(RESPONSIVE_COMPONENTS.input.height, breakpoint),
    '--gh-responsive-input-padding': getResponsiveValue(RESPONSIVE_COMPONENTS.input.padding, breakpoint),
    '--gh-responsive-card-padding': getResponsiveValue(RESPONSIVE_COMPONENTS.card.padding, breakpoint),
    '--gh-responsive-card-gap': getResponsiveValue(RESPONSIVE_COMPONENTS.card.gap, breakpoint),
  };
}

/**
 * Priority hierarchy for responsive design
 * Action > Status > Data > Metadata
 */
export const PRIORITY_HIERARCHY = {
  action: 1,    // Always visible, never hidden
  status: 2,    // Visible on tablet+, summarized on mobile
  data: 3,      // Full on desktop, grouped on tablet, essential on mobile
  metadata: 4   // Full on desktop, hidden/collapsed on smaller screens
} as const;

/**
 * Content visibility rules based on priority and breakpoint
 */
export const CONTENT_VISIBILITY = {
  mobile: {
    action: 'visible',
    status: 'badge-only',
    data: 'essential-only',
    metadata: 'hidden'
  },
  tablet: {
    action: 'visible',
    status: 'visible',
    data: 'grouped',
    metadata: 'collapsed'
  },
  desktop: {
    action: 'visible',
    status: 'visible',
    data: 'full',
    metadata: 'full'
  }
} as const;