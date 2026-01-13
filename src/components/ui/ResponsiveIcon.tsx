'use client';

import React, { useState } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface ResponsiveIconProps {
  icon: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted' | 'inherit';
  tooltip?: string;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
}

/**
 * ResponsiveIcon Component
 * 
 * Implements responsive icon patterns:
 * - Desktop: Minimum 20px size with tooltips
 * - Tablet: Appropriate sizing for touch interaction
 * - Mobile: Larger sizes for better touch targets
 * 
 * Validates Requirements: 7.2
 */
export function ResponsiveIcon({
  icon,
  size = 'md',
  color = 'inherit',
  tooltip,
  className = '',
  onClick,
  'aria-label': ariaLabel,
  ...props
}: ResponsiveIconProps) {
  const { breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();
  const [showTooltip, setShowTooltip] = useState(false);

  const iconClass = [
    'gh-responsive-icon',
    `gh-responsive-icon-${size}`,
    `gh-responsive-icon-${color}`,
    `gh-responsive-icon-${breakpoint}`,
    onClick && 'gh-responsive-icon-clickable',
    className
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleMouseEnter = () => {
    if (tooltip && isDesktop) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const iconElement = (
    <span
      className={iconClass}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel || tooltip}
      {...props}
    >
      {icon}
      
      {/* Desktop tooltip */}
      {tooltip && showTooltip && isDesktop && (
        <span className="gh-icon-tooltip" role="tooltip">
          {tooltip}
        </span>
      )}
    </span>
  );

  return iconElement;
}

/**
 * Status Icon Component
 * Specialized for status indicators with consistent sizing
 */
interface StatusIconProps {
  status: 'draft' | 'uploaded' | 'qc_processing' | 'qc_passed' | 'qc_failed' | 'approved' | 'published' | 'archived';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function StatusIcon({
  status,
  size = 'md',
  showLabel = false,
  className = ''
}: StatusIconProps) {
  const { breakpoint } = useBreakpoint();

  const statusConfig = {
    draft: { icon: '📝', label: 'Draft', color: 'muted' },
    uploaded: { icon: '⬆️', label: 'Uploaded', color: 'primary' },
    qc_processing: { icon: '⏳', label: 'In QC', color: 'warning' },
    qc_passed: { icon: '✅', label: 'QC Passed', color: 'success' },
    qc_failed: { icon: '❌', label: 'QC Failed', color: 'danger' },
    approved: { icon: '👍', label: 'Approved', color: 'success' },
    published: { icon: '🚀', label: 'Published', color: 'primary' },
    archived: { icon: '📦', label: 'Archived', color: 'muted' }
  };

  const config = statusConfig[status];
  
  const statusClass = [
    'gh-status-icon',
    `gh-status-icon-${status}`,
    `gh-status-icon-${size}`,
    `gh-status-icon-${breakpoint}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={statusClass}>
      <ResponsiveIcon
        icon={config.icon}
        size={size}
        color={config.color as any}
        tooltip={config.label}
        aria-label={config.label}
      />
      {showLabel && (
        <span className="gh-status-label">
          {config.label}
        </span>
      )}
    </span>
  );
}

/**
 * Action Icon Component
 * Specialized for action buttons with consistent behavior
 */
interface ActionIconProps {
  action: 'edit' | 'delete' | 'view' | 'download' | 'upload' | 'copy' | 'share' | 'settings' | 'more';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ActionIcon({
  action,
  size = 'md',
  disabled = false,
  onClick,
  className = ''
}: ActionIconProps) {
  const actionConfig = {
    edit: { icon: '✏️', label: 'Edit', color: 'primary' },
    delete: { icon: '🗑️', label: 'Delete', color: 'danger' },
    view: { icon: '👁️', label: 'View', color: 'secondary' },
    download: { icon: '⬇️', label: 'Download', color: 'primary' },
    upload: { icon: '⬆️', label: 'Upload', color: 'primary' },
    copy: { icon: '📋', label: 'Copy', color: 'secondary' },
    share: { icon: '🔗', label: 'Share', color: 'secondary' },
    settings: { icon: '⚙️', label: 'Settings', color: 'secondary' },
    more: { icon: '⋯', label: 'More options', color: 'secondary' }
  };

  const config = actionConfig[action];
  
  const actionClass = [
    'gh-action-icon',
    `gh-action-icon-${action}`,
    disabled && 'gh-action-icon-disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={actionClass}>
      <ResponsiveIcon
        icon={config.icon}
        size={size}
        color={disabled ? 'muted' : config.color as any}
        tooltip={config.label}
        onClick={disabled ? undefined : onClick}
        aria-label={config.label}
      />
    </span>
  );
}

/**
 * Icon Badge Component
 * Shows icons with notification badges
 */
interface IconBadgeProps {
  icon: React.ReactNode;
  badge?: string | number;
  badgeColor?: 'primary' | 'danger' | 'warning' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function IconBadge({
  icon,
  badge,
  badgeColor = 'danger',
  size = 'md',
  className = ''
}: IconBadgeProps) {
  const badgeClass = [
    'gh-icon-badge',
    `gh-icon-badge-${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClass}>
      <ResponsiveIcon icon={icon} size={size} />
      {badge && (
        <span className={`gh-badge gh-badge-${badgeColor}`}>
          {badge}
        </span>
      )}
    </span>
  );
}

/**
 * Loading Icon Component
 * Animated loading indicators
 */
interface LoadingIconProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'muted';
  className?: string;
}

export function LoadingIcon({
  size = 'md',
  color = 'primary',
  className = ''
}: LoadingIconProps) {
  const loadingClass = [
    'gh-loading-icon',
    `gh-loading-icon-${size}`,
    `gh-loading-icon-${color}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={loadingClass} aria-label="Loading">
      <svg className="gh-loading-svg" viewBox="0 0 24 24">
        <circle
          className="gh-loading-circle"
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

/**
 * Icon Grid Component
 * Responsive grid layout for multiple icons
 */
interface IconGridProps {
  children: React.ReactNode;
  columns?: number | 'auto';
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function IconGrid({
  children,
  columns = 'auto',
  spacing = 'md',
  className = ''
}: IconGridProps) {
  const { breakpoint } = useBreakpoint();

  const gridClass = [
    'gh-icon-grid',
    `gh-icon-grid-spacing-${spacing}`,
    `gh-icon-grid-${breakpoint}`,
    typeof columns === 'number' && `gh-icon-grid-cols-${columns}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClass}>
      {children}
    </div>
  );
}