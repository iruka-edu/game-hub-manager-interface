'use client';

import React, { useState } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface Action {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  onClick: () => void;
  isVisible?: boolean;
  isDisabled?: boolean;
  tooltip?: string;
}

interface AdaptiveActionBarProps {
  primaryActions: Action[];
  secondaryActions?: Action[];
  className?: string;
  position?: 'inline' | 'sticky-bottom' | 'sticky-top';
}

/**
 * AdaptiveActionBar Component
 * 
 * Implements responsive action bar patterns:
 * - Desktop: Inline action bar with full button labels
 * - Tablet: Sticky bottom action bar with grouped actions
 * - Mobile: Sticky bottom action bar with icon-only primary actions
 * 
 * Ensures primary actions remain visible across all breakpoints
 * 
 * Validates Requirements: 1.5, 3.7, 4.4
 */
export function AdaptiveActionBar({
  primaryActions,
  secondaryActions = [],
  className = '',
  position = 'inline'
}: AdaptiveActionBarProps) {
  const { breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();
  const [showSecondaryMenu, setShowSecondaryMenu] = useState(false);

  // Filter visible actions
  const visiblePrimaryActions = primaryActions.filter(action => action.isVisible !== false);
  const visibleSecondaryActions = secondaryActions.filter(action => action.isVisible !== false);

  // Desktop: Inline action bar with full labels
  if (isDesktop) {
    return (
      <div className={`gh-action-bar-desktop ${getPositionClass(position)} ${className}`}>
        <div className="gh-action-group-primary">
          {visiblePrimaryActions.map((action) => (
            <ActionButton
              key={action.key}
              action={action}
              layout="desktop"
              showLabel={true}
            />
          ))}
        </div>
        
        {visibleSecondaryActions.length > 0 && (
          <div className="gh-action-group-secondary">
            <SecondaryActionsDropdown
              actions={visibleSecondaryActions}
              layout="desktop"
            />
          </div>
        )}
      </div>
    );
  }

  // Tablet: Sticky bottom action bar with grouped actions
  if (isTablet) {
    return (
      <div className={`gh-action-bar-tablet ${getPositionClass(position)} ${className}`}>
        <div className="gh-action-bar-content">
          <div className="gh-action-group-primary">
            {visiblePrimaryActions.map((action) => (
              <ActionButton
                key={action.key}
                action={action}
                layout="tablet"
                showLabel={true}
              />
            ))}
          </div>
          
          {visibleSecondaryActions.length > 0 && (
            <div className="gh-action-group-secondary">
              <SecondaryActionsDropdown
                actions={visibleSecondaryActions}
                layout="tablet"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile: Sticky bottom action bar with icon-only primary actions
  return (
    <div className={`gh-action-bar-mobile ${getPositionClass(position)} ${className}`}>
      <div className="gh-action-bar-content">
        <div className="gh-action-group-primary">
          {visiblePrimaryActions.slice(0, 3).map((action) => ( // Limit to 3 primary actions
            <ActionButton
              key={action.key}
              action={action}
              layout="mobile"
              showLabel={false}
            />
          ))}
        </div>
        
        {(visiblePrimaryActions.length > 3 || visibleSecondaryActions.length > 0) && (
          <div className="gh-action-group-overflow">
            <OverflowActionsMenu
              primaryActions={visiblePrimaryActions.slice(3)}
              secondaryActions={visibleSecondaryActions}
              isOpen={showSecondaryMenu}
              onToggle={() => setShowSecondaryMenu(!showSecondaryMenu)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Action Button Component
 */
interface ActionButtonProps {
  action: Action;
  layout: 'desktop' | 'tablet' | 'mobile';
  showLabel: boolean;
}

function ActionButton({ action, layout, showLabel }: ActionButtonProps) {
  const buttonClass = `gh-btn gh-btn-${action.variant || 'primary'} gh-btn-${layout}`;
  
  return (
    <button
      className={buttonClass}
      onClick={action.onClick}
      disabled={action.isDisabled}
      title={action.tooltip || action.label}
      aria-label={action.label}
    >
      {action.icon && (
        <span className="gh-btn-icon" aria-hidden="true">
          {action.icon}
        </span>
      )}
      {showLabel && (
        <span className="gh-btn-label">
          {action.label}
        </span>
      )}
    </button>
  );
}

/**
 * Secondary Actions Dropdown Component
 */
interface SecondaryActionsDropdownProps {
  actions: Action[];
  layout: 'desktop' | 'tablet';
}

function SecondaryActionsDropdown({ actions, layout }: SecondaryActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="gh-dropdown-container">
      <button
        className={`gh-btn gh-btn-secondary gh-btn-${layout}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="gh-btn-icon">⋯</span>
        <span className="gh-btn-label">More</span>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="gh-dropdown-overlay"
            onClick={() => setIsOpen(false)}
          />
          <div className="gh-dropdown-menu" role="menu">
            {actions.map((action) => (
              <button
                key={action.key}
                className="gh-dropdown-item"
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                disabled={action.isDisabled}
                role="menuitem"
              >
                {action.icon && (
                  <span className="gh-dropdown-icon" aria-hidden="true">
                    {action.icon}
                  </span>
                )}
                <span className="gh-dropdown-label">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Overflow Actions Menu for Mobile
 */
interface OverflowActionsMenuProps {
  primaryActions: Action[];
  secondaryActions: Action[];
  isOpen: boolean;
  onToggle: () => void;
}

function OverflowActionsMenu({ 
  primaryActions, 
  secondaryActions, 
  isOpen, 
  onToggle 
}: OverflowActionsMenuProps) {
  const allActions = [...primaryActions, ...secondaryActions];
  
  return (
    <div className="gh-overflow-menu-container">
      <button
        className="gh-btn gh-btn-secondary gh-btn-mobile"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="More actions"
      >
        <span className="gh-btn-icon">⋯</span>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="gh-overflow-overlay"
            onClick={onToggle}
          />
          <div className="gh-overflow-menu" role="menu">
            <div className="gh-overflow-header">
              <span className="gh-overflow-title">Actions</span>
              <button 
                className="gh-overflow-close"
                onClick={onToggle}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <div className="gh-overflow-content">
              {allActions.map((action) => (
                <button
                  key={action.key}
                  className="gh-overflow-item"
                  onClick={() => {
                    action.onClick();
                    onToggle();
                  }}
                  disabled={action.isDisabled}
                  role="menuitem"
                >
                  {action.icon && (
                    <span className="gh-overflow-icon" aria-hidden="true">
                      {action.icon}
                    </span>
                  )}
                  <span className="gh-overflow-label">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Utility function to get position class
 */
function getPositionClass(position: string): string {
  switch (position) {
    case 'sticky-bottom':
      return 'gh-sticky-bottom';
    case 'sticky-top':
      return 'gh-sticky-top';
    case 'inline':
    default:
      return 'gh-inline';
  }
}

/**
 * Quick Action Floating Button for Mobile
 */
interface QuickActionButtonProps {
  action: Action;
  className?: string;
}

export function QuickActionButton({ action, className = '' }: QuickActionButtonProps) {
  const { isMobile } = useBreakpoint();
  
  if (!isMobile) {
    return null;
  }
  
  return (
    <button
      className={`gh-quick-action-btn ${className}`}
      onClick={action.onClick}
      disabled={action.isDisabled}
      title={action.label}
      aria-label={action.label}
    >
      {action.icon && (
        <span className="gh-quick-action-icon" aria-hidden="true">
          {action.icon}
        </span>
      )}
    </button>
  );
}

/**
 * Context Action Bar for specific sections
 */
interface ContextActionBarProps {
  title?: string;
  actions: Action[];
  className?: string;
}

export function ContextActionBar({ title, actions, className = '' }: ContextActionBarProps) {
  const { breakpoint } = useBreakpoint();
  
  return (
    <div className={`gh-context-action-bar gh-context-action-bar-${breakpoint} ${className}`}>
      {title && (
        <div className="gh-context-title">
          <h3 className="gh-responsive-heading gh-font-medium">{title}</h3>
        </div>
      )}
      <div className="gh-context-actions">
        <AdaptiveActionBar
          primaryActions={actions.filter(a => a.variant === 'primary' || !a.variant)}
          secondaryActions={actions.filter(a => a.variant !== 'primary' && a.variant)}
          position="inline"
        />
      </div>
    </div>
  );
}