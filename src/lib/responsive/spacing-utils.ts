/**
 * Responsive Spacing Utilities
 * 
 * Provides consistent spacing utilities that adapt across breakpoints
 * following the Progressive Disclosure architecture.
 * 
 * Validates Requirements: 7.4
 */

export type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
export type SpacingDirection = 'all' | 'x' | 'y' | 'top' | 'right' | 'bottom' | 'left';
export type SpacingType = 'margin' | 'padding' | 'gap';

/**
 * Spacing scale values for each breakpoint
 */
export const SPACING_SCALE = {
  desktop: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px'
  },
  tablet: {
    xs: '3px',
    sm: '6px',
    md: '9px',
    lg: '12px',
    xl: '15px',
    '2xl': '18px',
    '3xl': '24px',
    '4xl': '30px'
  },
  mobile: {
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '10px',
    '2xl': '12px',
    '3xl': '16px',
    '4xl': '20px'
  }
} as const;

/**
 * Generate responsive spacing class name
 */
export function getSpacingClass(
  type: SpacingType,
  size: SpacingSize,
  direction: SpacingDirection = 'all'
): string {
  const prefix = type === 'margin' ? 'm' : type === 'padding' ? 'p' : 'gap';
  const directionSuffix = direction === 'all' ? '' : `-${direction}`;
  
  return `gh-responsive-${prefix}${directionSuffix}-${size}`;
}

/**
 * Generate inline spacing styles for dynamic use
 */
export function getSpacingStyles(
  type: SpacingType,
  size: SpacingSize,
  direction: SpacingDirection = 'all'
): Record<string, string> {
  const cssVar = `var(--gh-responsive-space-${size})`;
  
  if (type === 'gap') {
    return { gap: cssVar };
  }
  
  const property = type === 'margin' ? 'margin' : 'padding';
  
  switch (direction) {
    case 'all':
      return { [property]: cssVar };
    case 'x':
      return {
        [`${property}Left`]: cssVar,
        [`${property}Right`]: cssVar
      };
    case 'y':
      return {
        [`${property}Top`]: cssVar,
        [`${property}Bottom`]: cssVar
      };
    case 'top':
      return { [`${property}Top`]: cssVar };
    case 'right':
      return { [`${property}Right`]: cssVar };
    case 'bottom':
      return { [`${property}Bottom`]: cssVar };
    case 'left':
      return { [`${property}Left`]: cssVar };
    default:
      return { [property]: cssVar };
  }
}

/**
 * Spacing component props interface
 */
export interface SpacingProps {
  m?: SpacingSize;
  mx?: SpacingSize;
  my?: SpacingSize;
  mt?: SpacingSize;
  mr?: SpacingSize;
  mb?: SpacingSize;
  ml?: SpacingSize;
  p?: SpacingSize;
  px?: SpacingSize;
  py?: SpacingSize;
  pt?: SpacingSize;
  pr?: SpacingSize;
  pb?: SpacingSize;
  pl?: SpacingSize;
  gap?: SpacingSize;
}

/**
 * Convert spacing props to CSS classes
 */
export function spacingPropsToClasses(props: SpacingProps): string[] {
  const classes: string[] = [];
  
  // Margin classes
  if (props.m) classes.push(getSpacingClass('margin', props.m));
  if (props.mx) classes.push(getSpacingClass('margin', props.mx, 'x'));
  if (props.my) classes.push(getSpacingClass('margin', props.my, 'y'));
  if (props.mt) classes.push(getSpacingClass('margin', props.mt, 'top'));
  if (props.mr) classes.push(getSpacingClass('margin', props.mr, 'right'));
  if (props.mb) classes.push(getSpacingClass('margin', props.mb, 'bottom'));
  if (props.ml) classes.push(getSpacingClass('margin', props.ml, 'left'));
  
  // Padding classes
  if (props.p) classes.push(getSpacingClass('padding', props.p));
  if (props.px) classes.push(getSpacingClass('padding', props.px, 'x'));
  if (props.py) classes.push(getSpacingClass('padding', props.py, 'y'));
  if (props.pt) classes.push(getSpacingClass('padding', props.pt, 'top'));
  if (props.pr) classes.push(getSpacingClass('padding', props.pr, 'right'));
  if (props.pb) classes.push(getSpacingClass('padding', props.pb, 'bottom'));
  if (props.pl) classes.push(getSpacingClass('padding', props.pl, 'left'));
  
  // Gap class
  if (props.gap) classes.push(getSpacingClass('gap', props.gap));
  
  return classes;
}

/**
 * Convert spacing props to inline styles
 */
export function spacingPropsToStyles(props: SpacingProps): Record<string, string> {
  let styles: Record<string, string> = {};
  
  // Margin styles
  if (props.m) styles = { ...styles, ...getSpacingStyles('margin', props.m) };
  if (props.mx) styles = { ...styles, ...getSpacingStyles('margin', props.mx, 'x') };
  if (props.my) styles = { ...styles, ...getSpacingStyles('margin', props.my, 'y') };
  if (props.mt) styles = { ...styles, ...getSpacingStyles('margin', props.mt, 'top') };
  if (props.mr) styles = { ...styles, ...getSpacingStyles('margin', props.mr, 'right') };
  if (props.mb) styles = { ...styles, ...getSpacingStyles('margin', props.mb, 'bottom') };
  if (props.ml) styles = { ...styles, ...getSpacingStyles('margin', props.ml, 'left') };
  
  // Padding styles
  if (props.p) styles = { ...styles, ...getSpacingStyles('padding', props.p) };
  if (props.px) styles = { ...styles, ...getSpacingStyles('padding', props.px, 'x') };
  if (props.py) styles = { ...styles, ...getSpacingStyles('padding', props.py, 'y') };
  if (props.pt) styles = { ...styles, ...getSpacingStyles('padding', props.pt, 'top') };
  if (props.pr) styles = { ...styles, ...getSpacingStyles('padding', props.pr, 'right') };
  if (props.pb) styles = { ...styles, ...getSpacingStyles('padding', props.pb, 'bottom') };
  if (props.pl) styles = { ...styles, ...getSpacingStyles('padding', props.pl, 'left') };
  
  // Gap style
  if (props.gap) styles = { ...styles, ...getSpacingStyles('gap', props.gap) };
  
  return styles;
}

/**
 * Responsive spacing hook for React components
 */
export function useResponsiveSpacing(props: SpacingProps) {
  const classes = spacingPropsToClasses(props);
  const styles = spacingPropsToStyles(props);
  
  return {
    className: classes.join(' '),
    style: styles
  };
}

/**
 * Spacing constants for common use cases
 */
export const SPACING_CONSTANTS = {
  // Component spacing
  COMPONENT_GAP: 'lg' as SpacingSize,
  SECTION_GAP: '2xl' as SpacingSize,
  CARD_PADDING: 'lg' as SpacingSize,
  BUTTON_PADDING: 'md' as SpacingSize,
  
  // Layout spacing
  LAYOUT_MARGIN: '2xl' as SpacingSize,
  CONTENT_PADDING: 'xl' as SpacingSize,
  SIDEBAR_PADDING: 'lg' as SpacingSize,
  
  // Form spacing
  FORM_FIELD_GAP: 'lg' as SpacingSize,
  FORM_GROUP_GAP: '2xl' as SpacingSize,
  INPUT_PADDING: 'md' as SpacingSize,
  
  // Navigation spacing
  NAV_ITEM_PADDING: 'md' as SpacingSize,
  NAV_GROUP_GAP: 'sm' as SpacingSize,
  
  // Action spacing
  ACTION_GROUP_GAP: 'md' as SpacingSize,
  ACTION_BUTTON_GAP: 'sm' as SpacingSize
} as const;

/**
 * Validate spacing size
 */
export function isValidSpacingSize(size: string): size is SpacingSize {
  return ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'].includes(size);
}

/**
 * Get spacing value for current breakpoint
 */
export function getSpacingValue(size: SpacingSize, breakpoint: 'desktop' | 'tablet' | 'mobile'): string {
  return SPACING_SCALE[breakpoint][size];
}