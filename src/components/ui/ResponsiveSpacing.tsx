'use client';

import React from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { 
  SpacingProps, 
  spacingPropsToClasses, 
  spacingPropsToStyles,
  SPACING_CONSTANTS 
} from '@/lib/responsive/spacing-utils';

interface ResponsiveSpacingProps extends SpacingProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ResponsiveSpacing Component
 * 
 * Applies responsive spacing utilities to any element.
 * Spacing adapts automatically across breakpoints following
 * the Progressive Disclosure architecture.
 * 
 * Validates Requirements: 7.4
 */
export function ResponsiveSpacing({
  children,
  as: Component = 'div',
  className = '',
  style = {},
  ...spacingProps
}: ResponsiveSpacingProps) {
  const { breakpoint } = useBreakpoint();
  
  const spacingClasses = spacingPropsToClasses(spacingProps);
  const spacingStyles = spacingPropsToStyles(spacingProps);
  
  const combinedClassName = [
    'gh-responsive-spacing',
    `gh-responsive-spacing-${breakpoint}`,
    ...spacingClasses,
    className
  ].filter(Boolean).join(' ');
  
  const combinedStyle = {
    ...spacingStyles,
    ...style
  };
  
  return (
    <Component 
      className={combinedClassName}
      style={combinedStyle}
    >
      {children}
    </Component>
  );
}

/**
 * Responsive Stack Component
 * Vertical layout with responsive spacing
 */
interface ResponsiveStackProps extends Omit<ResponsiveSpacingProps, 'gap'> {
  gap?: keyof typeof SPACING_CONSTANTS | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export function ResponsiveStack({
  children,
  gap = 'COMPONENT_GAP',
  align = 'stretch',
  justify = 'start',
  className = '',
  ...props
}: ResponsiveStackProps) {
  const gapValue = gap in SPACING_CONSTANTS ? SPACING_CONSTANTS[gap as keyof typeof SPACING_CONSTANTS] : gap;
  
  const stackClass = [
    'gh-responsive-stack',
    `gh-responsive-stack-align-${align}`,
    `gh-responsive-stack-justify-${justify}`,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <ResponsiveSpacing
      {...props}
      gap={gapValue}
      className={stackClass}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'start' ? 'flex-start' : 
                   align === 'end' ? 'flex-end' : 
                   align === 'center' ? 'center' : 'stretch',
        justifyContent: justify === 'start' ? 'flex-start' :
                       justify === 'end' ? 'flex-end' :
                       justify === 'center' ? 'center' :
                       justify === 'between' ? 'space-between' :
                       justify === 'around' ? 'space-around' :
                       justify === 'evenly' ? 'space-evenly' : 'flex-start',
        ...props.style
      }}
    >
      {children}
    </ResponsiveSpacing>
  );
}

/**
 * Responsive Inline Component
 * Horizontal layout with responsive spacing
 */
interface ResponsiveInlineProps extends Omit<ResponsiveSpacingProps, 'gap'> {
  gap?: keyof typeof SPACING_CONSTANTS | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

export function ResponsiveInline({
  children,
  gap = 'ACTION_BUTTON_GAP',
  align = 'center',
  justify = 'start',
  wrap = false,
  className = '',
  ...props
}: ResponsiveInlineProps) {
  const gapValue = gap in SPACING_CONSTANTS ? SPACING_CONSTANTS[gap as keyof typeof SPACING_CONSTANTS] : gap;
  
  const inlineClass = [
    'gh-responsive-inline',
    `gh-responsive-inline-align-${align}`,
    `gh-responsive-inline-justify-${justify}`,
    wrap && 'gh-responsive-inline-wrap',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <ResponsiveSpacing
      {...props}
      gap={gapValue}
      className={inlineClass}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: align === 'start' ? 'flex-start' : 
                   align === 'end' ? 'flex-end' : 
                   align === 'center' ? 'center' :
                   align === 'baseline' ? 'baseline' : 'stretch',
        justifyContent: justify === 'start' ? 'flex-start' :
                       justify === 'end' ? 'flex-end' :
                       justify === 'center' ? 'center' :
                       justify === 'between' ? 'space-between' :
                       justify === 'around' ? 'space-around' :
                       justify === 'evenly' ? 'space-evenly' : 'flex-start',
        flexWrap: wrap ? 'wrap' : 'nowrap',
        ...props.style
      }}
    >
      {children}
    </ResponsiveSpacing>
  );
}

/**
 * Responsive Grid Component
 * Grid layout with responsive spacing
 */
interface ResponsiveGridProps extends Omit<ResponsiveSpacingProps, 'gap'> {
  gap?: keyof typeof SPACING_CONSTANTS | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  columns?: number | 'auto' | 'responsive';
  rows?: number | 'auto';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'stretch';
}

export function ResponsiveGrid({
  children,
  gap = 'COMPONENT_GAP',
  columns = 'responsive',
  rows = 'auto',
  align = 'stretch',
  justify = 'stretch',
  className = '',
  ...props
}: ResponsiveGridProps) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const gapValue = gap in SPACING_CONSTANTS ? SPACING_CONSTANTS[gap as keyof typeof SPACING_CONSTANTS] : gap;
  
  // Responsive column calculation
  let gridColumns: string;
  if (columns === 'responsive') {
    if (isMobile) {
      gridColumns = '1fr';
    } else if (isTablet) {
      gridColumns = 'repeat(2, 1fr)';
    } else {
      gridColumns = 'repeat(3, 1fr)';
    }
  } else if (columns === 'auto') {
    gridColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
  } else {
    gridColumns = `repeat(${columns}, 1fr)`;
  }
  
  const gridRows = rows === 'auto' ? 'auto' : `repeat(${rows}, 1fr)`;
  
  const gridClass = [
    'gh-responsive-grid',
    `gh-responsive-grid-align-${align}`,
    `gh-responsive-grid-justify-${justify}`,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <ResponsiveSpacing
      {...props}
      gap={gapValue}
      className={gridClass}
      style={{
        display: 'grid',
        gridTemplateColumns: gridColumns,
        gridTemplateRows: gridRows,
        alignItems: align === 'start' ? 'start' : 
                   align === 'end' ? 'end' : 
                   align === 'center' ? 'center' : 'stretch',
        justifyItems: justify === 'start' ? 'start' :
                     justify === 'end' ? 'end' :
                     justify === 'center' ? 'center' : 'stretch',
        ...props.style
      }}
    >
      {children}
    </ResponsiveSpacing>
  );
}

/**
 * Responsive Section Component
 * Section wrapper with consistent spacing
 */
interface ResponsiveSectionProps extends ResponsiveSpacingProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'card' | 'bordered';
}

export function ResponsiveSection({
  children,
  title,
  subtitle,
  actions,
  variant = 'default',
  className = '',
  ...props
}: ResponsiveSectionProps) {
  const sectionClass = [
    'gh-responsive-section',
    `gh-responsive-section-${variant}`,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <ResponsiveSpacing
      {...props}
      p={variant === 'card' ? SPACING_CONSTANTS.CARD_PADDING : undefined}
      className={sectionClass}
    >
      {(title || subtitle || actions) && (
        <div className="gh-section-header">
          <div className="gh-section-header-content">
            {title && (
              <h2 className="gh-section-title gh-responsive-heading gh-font-semibold">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="gh-section-subtitle gh-responsive-meta gh-text-muted">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="gh-section-actions">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className="gh-section-content">
        {children}
      </div>
    </ResponsiveSpacing>
  );
}

/**
 * Responsive Card Component
 * Card wrapper with responsive spacing and styling
 */
interface ResponsiveCardProps extends ResponsiveSpacingProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  interactive?: boolean;
  onClick?: () => void;
}

export function ResponsiveCard({
  children,
  variant = 'default',
  interactive = false,
  onClick,
  className = '',
  ...props
}: ResponsiveCardProps) {
  const cardClass = [
    'gh-responsive-card',
    `gh-responsive-card-${variant}`,
    interactive && 'gh-responsive-card-interactive',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <ResponsiveSpacing
      {...props}
      p={SPACING_CONSTANTS.CARD_PADDING}
      className={cardClass}
      onClick={onClick}
      style={{
        cursor: interactive ? 'pointer' : undefined,
        ...props.style
      }}
    >
      {children}
    </ResponsiveSpacing>
  );
}