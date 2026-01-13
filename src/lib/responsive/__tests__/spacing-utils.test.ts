/**
 * Unit tests for responsive spacing utilities
 */

import {
  getSpacingClass,
  getSpacingStyles,
  spacingPropsToClasses,
  spacingPropsToStyles,
  isValidSpacingSize,
  getSpacingValue,
  SPACING_SCALE,
  SPACING_CONSTANTS
} from '../spacing-utils';

describe('Responsive Spacing Utilities', () => {
  describe('getSpacingClass', () => {
    it('should generate correct margin class names', () => {
      expect(getSpacingClass('margin', 'lg')).toBe('gh-responsive-m-lg');
      expect(getSpacingClass('margin', 'sm', 'x')).toBe('gh-responsive-m-x-sm');
      expect(getSpacingClass('margin', 'md', 'top')).toBe('gh-responsive-m-top-md');
    });

    it('should generate correct padding class names', () => {
      expect(getSpacingClass('padding', 'xl')).toBe('gh-responsive-p-xl');
      expect(getSpacingClass('padding', 'lg', 'y')).toBe('gh-responsive-p-y-lg');
      expect(getSpacingClass('padding', 'sm', 'bottom')).toBe('gh-responsive-p-bottom-sm');
    });

    it('should generate correct gap class names', () => {
      expect(getSpacingClass('gap', 'md')).toBe('gh-responsive-gap-md');
    });
  });

  describe('getSpacingStyles', () => {
    it('should generate correct margin styles', () => {
      expect(getSpacingStyles('margin', 'lg')).toEqual({
        margin: 'var(--gh-responsive-space-lg)'
      });

      expect(getSpacingStyles('margin', 'sm', 'x')).toEqual({
        marginLeft: 'var(--gh-responsive-space-sm)',
        marginRight: 'var(--gh-responsive-space-sm)'
      });

      expect(getSpacingStyles('margin', 'md', 'top')).toEqual({
        marginTop: 'var(--gh-responsive-space-md)'
      });
    });

    it('should generate correct padding styles', () => {
      expect(getSpacingStyles('padding', 'xl')).toEqual({
        padding: 'var(--gh-responsive-space-xl)'
      });

      expect(getSpacingStyles('padding', 'lg', 'y')).toEqual({
        paddingTop: 'var(--gh-responsive-space-lg)',
        paddingBottom: 'var(--gh-responsive-space-lg)'
      });
    });

    it('should generate correct gap styles', () => {
      expect(getSpacingStyles('gap', 'md')).toEqual({
        gap: 'var(--gh-responsive-space-md)'
      });
    });
  });

  describe('spacingPropsToClasses', () => {
    it('should convert spacing props to class names', () => {
      const props = {
        m: 'lg' as const,
        px: 'md' as const,
        mt: 'sm' as const,
        gap: 'xl' as const
      };

      const classes = spacingPropsToClasses(props);
      
      expect(classes).toContain('gh-responsive-m-lg');
      expect(classes).toContain('gh-responsive-p-x-md');
      expect(classes).toContain('gh-responsive-m-top-sm');
      expect(classes).toContain('gh-responsive-gap-xl');
    });

    it('should handle empty props', () => {
      const classes = spacingPropsToClasses({});
      expect(classes).toEqual([]);
    });
  });

  describe('spacingPropsToStyles', () => {
    it('should convert spacing props to inline styles', () => {
      const props = {
        m: 'lg' as const,
        px: 'md' as const,
        gap: 'sm' as const
      };

      const styles = spacingPropsToStyles(props);
      
      expect(styles).toEqual({
        margin: 'var(--gh-responsive-space-lg)',
        paddingLeft: 'var(--gh-responsive-space-md)',
        paddingRight: 'var(--gh-responsive-space-md)',
        gap: 'var(--gh-responsive-space-sm)'
      });
    });
  });

  describe('isValidSpacingSize', () => {
    it('should validate spacing sizes correctly', () => {
      expect(isValidSpacingSize('xs')).toBe(true);
      expect(isValidSpacingSize('sm')).toBe(true);
      expect(isValidSpacingSize('md')).toBe(true);
      expect(isValidSpacingSize('lg')).toBe(true);
      expect(isValidSpacingSize('xl')).toBe(true);
      expect(isValidSpacingSize('2xl')).toBe(true);
      expect(isValidSpacingSize('3xl')).toBe(true);
      expect(isValidSpacingSize('4xl')).toBe(true);
      
      expect(isValidSpacingSize('invalid')).toBe(false);
      expect(isValidSpacingSize('5xl')).toBe(false);
    });
  });

  describe('getSpacingValue', () => {
    it('should return correct values for each breakpoint', () => {
      expect(getSpacingValue('lg', 'desktop')).toBe('16px');
      expect(getSpacingValue('lg', 'tablet')).toBe('12px');
      expect(getSpacingValue('lg', 'mobile')).toBe('8px');
      
      expect(getSpacingValue('md', 'desktop')).toBe('12px');
      expect(getSpacingValue('md', 'tablet')).toBe('9px');
      expect(getSpacingValue('md', 'mobile')).toBe('6px');
    });
  });

  describe('SPACING_SCALE', () => {
    it('should maintain proportional relationships', () => {
      // Test desktop scale
      const desktop = SPACING_SCALE.desktop;
      expect(parseInt(desktop.xs)).toBeLessThan(parseInt(desktop.sm));
      expect(parseInt(desktop.sm)).toBeLessThan(parseInt(desktop.md));
      expect(parseInt(desktop.md)).toBeLessThan(parseInt(desktop.lg));
      expect(parseInt(desktop.lg)).toBeLessThan(parseInt(desktop.xl));
      
      // Test that mobile values are smaller than desktop
      const mobile = SPACING_SCALE.mobile;
      expect(parseInt(mobile.lg)).toBeLessThan(parseInt(desktop.lg));
      expect(parseInt(mobile.md)).toBeLessThan(parseInt(desktop.md));
    });
  });

  describe('SPACING_CONSTANTS', () => {
    it('should provide consistent constants', () => {
      expect(SPACING_CONSTANTS.COMPONENT_GAP).toBe('lg');
      expect(SPACING_CONSTANTS.SECTION_GAP).toBe('2xl');
      expect(SPACING_CONSTANTS.CARD_PADDING).toBe('lg');
      expect(SPACING_CONSTANTS.BUTTON_PADDING).toBe('md');
    });
  });
});