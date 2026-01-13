'use client';

import { useState, useEffect } from 'react';
import { getBreakpointFromWidth, type Breakpoint } from '@/lib/responsive/breakpoints';

/**
 * Hook for detecting current responsive breakpoint
 * 
 * Returns the current breakpoint based on window width:
 * - mobile: ≤767px (monitoring and quick actions)
 * - tablet: 768px-1199px (review and basic QC)
 * - desktop: ≥1200px (full management)
 */
export function useBreakpoint(): {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
} {
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');

  useEffect(() => {
    // Set initial width
    const updateWidth = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setBreakpoint(getBreakpointFromWidth(width));
    };

    // Set initial value
    updateWidth();

    // Add event listener
    window.addEventListener('resize', updateWidth);

    // Cleanup
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    width: windowWidth
  };
}

/**
 * Hook for checking if current breakpoint matches specific breakpoint(s)
 */
export function useBreakpointMatch(targetBreakpoints: Breakpoint | Breakpoint[]): boolean {
  const { breakpoint } = useBreakpoint();
  
  if (Array.isArray(targetBreakpoints)) {
    return targetBreakpoints.includes(breakpoint);
  }
  
  return breakpoint === targetBreakpoints;
}

/**
 * Hook for getting responsive values based on current breakpoint
 */
export function useResponsiveValue<T>(values: Record<Breakpoint, T>): T {
  const { breakpoint } = useBreakpoint();
  return values[breakpoint];
}