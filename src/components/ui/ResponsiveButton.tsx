'use client';

import React from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface ResponsiveButtonProps {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  tooltip?: string;
  'aria-label'?: string;
}

/**
 * ResponsiveButton Component
 * 
 * Implements responsive button patterns:
 * - Desktop: Text + icon with full labels
 * - Tablet: Text with optional icon
 * - Mobile: Icon + short label with proper touch targets (44px minimum)
 * 
 * Validates Requirements: 7.1, 7.5
 */
export function ResponsiveButton({
  children,
  icon,
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  tooltip,
  'aria-label': ariaLabel,
  ...props
}: ResponsiveButtonProps) {
  const { breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();

  const buttonClass = [
    'gh-responsive-btn',
    `gh-responsive-btn-${variant}`,
    `gh-responsive-btn-${size}`,
    `gh-responsive-btn-${breakpoint}`,
    disabled && 'gh-responsive-btn-disabled',
    loading && 'gh-responsive-btn-loading',
    className
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={handleClick}
      disabled={disabled || loading}
      title={tooltip || (isMobile ? label : undefined)}
      aria-label={ariaLabel || label}
      {...props}
    >
      {loading && (
        <span className="gh-btn-spinner" aria-hidden="true">
          ⟳
        </span>
      )}
      
      {!loading && icon && (
        <span className="gh-btn-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      
      {/* Desktop: Show full label */}
      {isDesktop && !loading && (
        <span className="gh-btn-label gh-btn-label-desktop">
          {children || label}
        </span>
      )}
      
      {/* Tablet: Show text only */}
      {isTablet && !loading && (
        <span className="gh-btn-label gh-btn-label-tablet">
          {children || label}
        </span>
      )}
      
      {/* Mobile: Show short label or icon only */}
      {isMobile && !loading && (
        <span className="gh-btn-label gh-btn-label-mobile">
          {getShortLabel(label)}
        </span>
      )}
    </button>
  );
}

/**
 * Responsive Icon Button Component
 * Specialized for icon-only buttons with proper touch targets
 */
interface ResponsiveIconButtonProps {
  icon: React.ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  tooltip?: string;
}

export function ResponsiveIconButton({
  icon,
  label,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  tooltip,
  ...props
}: ResponsiveIconButtonProps) {
  const { breakpoint } = useBreakpoint();

  const buttonClass = [
    'gh-responsive-icon-btn',
    `gh-responsive-icon-btn-${variant}`,
    `gh-responsive-icon-btn-${size}`,
    `gh-responsive-icon-btn-${breakpoint}`,
    disabled && 'gh-responsive-icon-btn-disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      title={tooltip || label}
      aria-label={label}
      {...props}
    >
      <span className="gh-icon-btn-icon" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}

/**
 * Responsive Button Group Component
 * Groups buttons with appropriate spacing and layout
 */
interface ResponsiveButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical' | 'auto';
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ResponsiveButtonGroup({
  children,
  orientation = 'auto',
  spacing = 'md',
  className = ''
}: ResponsiveButtonGroupProps) {
  const { breakpoint, isMobile } = useBreakpoint();

  // Auto orientation: horizontal on desktop/tablet, vertical on mobile
  const actualOrientation = orientation === 'auto' 
    ? (isMobile ? 'vertical' : 'horizontal')
    : orientation;

  const groupClass = [
    'gh-responsive-btn-group',
    `gh-responsive-btn-group-${actualOrientation}`,
    `gh-responsive-btn-group-spacing-${spacing}`,
    `gh-responsive-btn-group-${breakpoint}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={groupClass} role="group">
      {children}
    </div>
  );
}

/**
 * Floating Action Button for Mobile
 */
interface FloatingActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
}

export function FloatingActionButton({
  icon,
  label,
  onClick,
  variant = 'primary',
  position = 'bottom-right',
  className = ''
}: FloatingActionButtonProps) {
  const { isMobile } = useBreakpoint();

  // Only show on mobile
  if (!isMobile) {
    return null;
  }

  const fabClass = [
    'gh-fab',
    `gh-fab-${variant}`,
    `gh-fab-${position}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={fabClass}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <span className="gh-fab-icon" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}

/**
 * Helper function to create short labels for mobile
 */
function getShortLabel(label: string): string {
  const shortLabels: Record<string, string> = {
    'Save Draft': 'Save',
    'Submit to QC': 'Submit',
    'Publish Game': 'Publish',
    'Archive Game': 'Archive',
    'Delete Game': 'Delete',
    'Edit Game': 'Edit',
    'View Details': 'View',
    'Download File': 'Download',
    'Upload File': 'Upload',
    'Create New': 'Create',
    'Add User': 'Add',
    'Remove User': 'Remove',
    'Send Message': 'Send',
    'Cancel Action': 'Cancel',
    'Confirm Action': 'OK',
    'Go Back': 'Back',
    'Next Step': 'Next',
    'Previous Step': 'Prev',
    'Show More': 'More',
    'Show Less': 'Less'
  };

  // Return predefined short label or truncate to first word
  return shortLabels[label] || label.split(' ')[0];
}

/**
 * Button Loading Spinner Component
 */
export function ButtonSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`gh-btn-spinner gh-btn-spinner-${size}`} aria-hidden="true">
      <svg className="gh-spinner-svg" viewBox="0 0 24 24">
        <circle
          className="gh-spinner-circle"
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="2"
        />
      </svg>
    </span>
  );
}