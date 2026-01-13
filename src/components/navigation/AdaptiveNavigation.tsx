'use client';

import React, { useState } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  isActive?: boolean;
  children?: NavigationItem[];
}

interface AdaptiveNavigationProps {
  items: NavigationItem[];
  currentPath: string;
  onNavigate?: (item: NavigationItem) => void;
  className?: string;
}

/**
 * AdaptiveNavigation Component
 * 
 * Implements responsive navigation patterns:
 * - Desktop: Fixed sidebar navigation
 * - Tablet: Collapsible hamburger menu
 * - Mobile: Bottom tab bar navigation
 * 
 * Validates Requirements: 8.1, 8.2, 8.3
 */
export function AdaptiveNavigation({
  items,
  currentPath,
  onNavigate,
  className = ''
}: AdaptiveNavigationProps) {
  const { breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Desktop: Fixed Sidebar Navigation
  if (isDesktop) {
    return (
      <nav className={`gh-nav-desktop ${className}`}>
        <div className="gh-nav-header">
          <h2 className="gh-responsive-heading gh-font-semibold">Game Hub</h2>
        </div>
        <ul className="gh-nav-list">
          {items.map((item) => (
            <NavigationItemDesktop
              key={item.id}
              item={item}
              currentPath={currentPath}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </nav>
    );
  }

  // Tablet: Hamburger Menu
  if (isTablet) {
    return (
      <>
        <nav className={`gh-nav-tablet ${className}`}>
          <div className="gh-nav-header-tablet">
            <h2 className="gh-responsive-heading gh-font-semibold">Game Hub</h2>
            <button
              className="gh-hamburger-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <HamburgerIcon isOpen={isMenuOpen} />
            </button>
          </div>
        </nav>
        
        {/* Collapsible Menu Overlay */}
        {isMenuOpen && (
          <div className="gh-nav-overlay">
            <div className="gh-nav-menu-tablet">
              <ul className="gh-nav-list-tablet">
                {items.map((item) => (
                  <NavigationItemTablet
                    key={item.id}
                    item={item}
                    currentPath={currentPath}
                    onNavigate={(navItem) => {
                      onNavigate?.(navItem);
                      setIsMenuOpen(false);
                    }}
                  />
                ))}
              </ul>
            </div>
          </div>
        )}
      </>
    );
  }

  // Mobile: Bottom Tab Bar
  return (
    <nav className={`gh-nav-mobile ${className}`}>
      <ul className="gh-nav-tabs">
        {items.slice(0, 5).map((item) => ( // Limit to 5 items for mobile
          <NavigationItemMobile
            key={item.id}
            item={item}
            currentPath={currentPath}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </nav>
  );
}

/**
 * Desktop Navigation Item Component
 */
function NavigationItemDesktop({
  item,
  currentPath,
  onNavigate
}: {
  item: NavigationItem;
  currentPath: string;
  onNavigate?: (item: NavigationItem) => void;
}) {
  const isActive = item.isActive || currentPath === item.href;
  
  return (
    <li className="gh-nav-item-desktop">
      <a
        href={item.href}
        className={`gh-nav-link-desktop ${isActive ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          onNavigate?.(item);
        }}
      >
        {item.icon && <span className="gh-nav-icon">{item.icon}</span>}
        <span className="gh-nav-label">{item.label}</span>
        {item.badge && <span className="gh-nav-badge">{item.badge}</span>}
      </a>
      
      {item.children && (
        <ul className="gh-nav-submenu">
          {item.children.map((child) => (
            <NavigationItemDesktop
              key={child.id}
              item={child}
              currentPath={currentPath}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Tablet Navigation Item Component
 */
function NavigationItemTablet({
  item,
  currentPath,
  onNavigate
}: {
  item: NavigationItem;
  currentPath: string;
  onNavigate?: (item: NavigationItem) => void;
}) {
  const isActive = item.isActive || currentPath === item.href;
  
  return (
    <li className="gh-nav-item-tablet">
      <a
        href={item.href}
        className={`gh-nav-link-tablet ${isActive ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          onNavigate?.(item);
        }}
      >
        {item.icon && <span className="gh-nav-icon">{item.icon}</span>}
        <span className="gh-nav-label">{item.label}</span>
        {item.badge && <span className="gh-nav-badge">{item.badge}</span>}
      </a>
    </li>
  );
}

/**
 * Mobile Navigation Item Component
 */
function NavigationItemMobile({
  item,
  currentPath,
  onNavigate
}: {
  item: NavigationItem;
  currentPath: string;
  onNavigate?: (item: NavigationItem) => void;
}) {
  const isActive = item.isActive || currentPath === item.href;
  
  return (
    <li className="gh-nav-item-mobile">
      <a
        href={item.href}
        className={`gh-nav-link-mobile ${isActive ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          onNavigate?.(item);
        }}
      >
        {item.icon && <span className="gh-nav-icon-mobile">{item.icon}</span>}
        <span className="gh-nav-label-mobile">{item.label}</span>
        {item.badge && <span className="gh-nav-badge-mobile">{item.badge}</span>}
      </a>
    </li>
  );
}

/**
 * Hamburger Menu Icon Component
 */
function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className={`gh-hamburger-icon ${isOpen ? 'open' : ''}`}>
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}

/**
 * Breadcrumb Component for Desktop and Tablet
 */
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate?: (href: string) => void;
}

export function ResponsiveBreadcrumb({ items, onNavigate }: BreadcrumbProps) {
  const { isMobile } = useBreakpoint();
  
  // Hide breadcrumbs on mobile
  if (isMobile) {
    return null;
  }
  
  return (
    <nav className="gh-breadcrumb" aria-label="Breadcrumb">
      <ol className="gh-breadcrumb-list">
        {items.map((item, index) => (
          <li key={index} className="gh-breadcrumb-item">
            {item.href && index < items.length - 1 ? (
              <a
                href={item.href}
                className="gh-breadcrumb-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate?.(item.href!);
                }}
              >
                {item.label}
              </a>
            ) : (
              <span className="gh-breadcrumb-current">{item.label}</span>
            )}
            {index < items.length - 1 && (
              <span className="gh-breadcrumb-separator" aria-hidden="true">
                /
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}