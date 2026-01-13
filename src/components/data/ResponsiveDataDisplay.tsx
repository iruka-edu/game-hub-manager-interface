'use client';

import React from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface ColumnDefinition {
  key: string;
  label: string;
  priority: 'action' | 'status' | 'data' | 'metadata';
  render?: (value: any, item: any) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
}

interface ActionDefinition {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: (item: any) => void;
  isVisible?: (item: any) => boolean;
  isDisabled?: (item: any) => boolean;
}

interface ResponsiveDataDisplayProps<T = any> {
  data: T[];
  columns: ColumnDefinition[];
  primaryActions: ActionDefinition[];
  secondaryActions?: ActionDefinition[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * ResponsiveDataDisplay Component
 * 
 * Implements responsive data display patterns:
 * - Desktop: Full table with all columns
 * - Tablet: Condensed table or card grid
 * - Mobile: Card list with essential info only
 * 
 * Follows Action > Status > Data > Metadata priority hierarchy
 * 
 * Validates Requirements: 2.4, 4.2, 4.3, 9.1
 */
export function ResponsiveDataDisplay<T = any>({
  data,
  columns,
  primaryActions,
  secondaryActions = [],
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  onSort,
  sortColumn,
  sortDirection
}: ResponsiveDataDisplayProps<T>) {
  const { breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();

  if (loading) {
    return <DataDisplaySkeleton breakpoint={breakpoint} />;
  }

  if (data.length === 0) {
    return (
      <div className={`gh-data-display-empty ${className}`}>
        <p className="gh-responsive-body gh-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  // Desktop: Full table with all columns
  if (isDesktop) {
    return (
      <div className={`gh-data-display-desktop ${className}`}>
        <TableView
          data={data}
          columns={columns}
          primaryActions={primaryActions}
          secondaryActions={secondaryActions}
          onSort={onSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
        />
      </div>
    );
  }

  // Tablet: Condensed table or card grid
  if (isTablet) {
    return (
      <div className={`gh-data-display-tablet ${className}`}>
        <CardGridView
          data={data}
          columns={columns}
          primaryActions={primaryActions}
          secondaryActions={secondaryActions}
          showMetadata={true}
        />
      </div>
    );
  }

  // Mobile: Card list with essential info only
  return (
    <div className={`gh-data-display-mobile ${className}`}>
      <CardListView
        data={data}
        columns={columns}
        primaryActions={primaryActions}
        showMetadata={false}
      />
    </div>
  );
}

/**
 * Desktop Table View Component
 */
function TableView<T>({
  data,
  columns,
  primaryActions,
  secondaryActions,
  onSort,
  sortColumn,
  sortDirection
}: {
  data: T[];
  columns: ColumnDefinition[];
  primaryActions: ActionDefinition[];
  secondaryActions: ActionDefinition[];
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}) {
  const handleSort = (column: ColumnDefinition) => {
    if (!column.sortable || !onSort) return;
    
    const newDirection = 
      sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newDirection);
  };

  return (
    <div className="gh-table-container">
      <table className="gh-table gh-table-responsive">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`gh-table-header ${column.className || ''} ${
                  column.sortable ? 'sortable' : ''
                }`}
                style={{ width: column.width }}
                onClick={() => handleSort(column)}
              >
                <div className="gh-table-header-content">
                  <span className="gh-responsive-meta gh-font-medium">
                    {column.label}
                  </span>
                  {column.sortable && (
                    <SortIcon
                      active={sortColumn === column.key}
                      direction={sortColumn === column.key ? sortDirection : undefined}
                    />
                  )}
                </div>
              </th>
            ))}
            <th className="gh-table-header gh-table-actions-header">
              <span className="gh-responsive-meta gh-font-medium">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="gh-table-row">
              {columns.map((column) => (
                <td key={column.key} className={`gh-table-cell ${column.className || ''}`}>
                  {column.render 
                    ? column.render(item[column.key as keyof T], item)
                    : String(item[column.key as keyof T] || '')
                  }
                </td>
              ))}
              <td className="gh-table-cell gh-table-actions-cell">
                <ActionButtons
                  item={item}
                  primaryActions={primaryActions}
                  secondaryActions={secondaryActions}
                  layout="inline"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Tablet Card Grid View Component
 */
function CardGridView<T>({
  data,
  columns,
  primaryActions,
  secondaryActions,
  showMetadata
}: {
  data: T[];
  columns: ColumnDefinition[];
  primaryActions: ActionDefinition[];
  secondaryActions: ActionDefinition[];
  showMetadata: boolean;
}) {
  const prioritizedColumns = columns
    .filter(col => showMetadata || col.priority !== 'metadata')
    .sort((a, b) => {
      const priorityOrder = { action: 1, status: 2, data: 3, metadata: 4 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  return (
    <div className="gh-card-grid">
      {data.map((item, index) => (
        <div key={index} className="gh-card gh-card-responsive">
          <div className="gh-card-content">
            {prioritizedColumns.map((column) => (
              <div key={column.key} className={`gh-card-field priority-${column.priority}`}>
                <span className="gh-card-label gh-responsive-meta gh-text-muted">
                  {column.label}:
                </span>
                <span className="gh-card-value gh-responsive-body">
                  {column.render 
                    ? column.render(item[column.key as keyof T], item)
                    : String(item[column.key as keyof T] || '')
                  }
                </span>
              </div>
            ))}
          </div>
          <div className="gh-card-actions">
            <ActionButtons
              item={item}
              primaryActions={primaryActions}
              secondaryActions={secondaryActions}
              layout="stacked"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Mobile Card List View Component
 */
function CardListView<T>({
  data,
  columns,
  primaryActions,
  showMetadata
}: {
  data: T[];
  columns: ColumnDefinition[];
  primaryActions: ActionDefinition[];
  showMetadata: boolean;
}) {
  // Show only essential columns (action, status, primary data)
  const essentialColumns = columns
    .filter(col => col.priority === 'action' || col.priority === 'status' || 
                  (col.priority === 'data' && columns.indexOf(col) < 2))
    .sort((a, b) => {
      const priorityOrder = { action: 1, status: 2, data: 3, metadata: 4 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  return (
    <div className="gh-card-list">
      {data.map((item, index) => (
        <div key={index} className="gh-card gh-card-mobile">
          <div className="gh-card-header">
            {essentialColumns.slice(0, 2).map((column) => (
              <div key={column.key} className="gh-card-header-item">
                {column.render 
                  ? column.render(item[column.key as keyof T], item)
                  : String(item[column.key as keyof T] || '')
                }
              </div>
            ))}
          </div>
          <div className="gh-card-actions-mobile">
            <ActionButtons
              item={item}
              primaryActions={primaryActions.slice(0, 2)} // Limit to 2 primary actions
              secondaryActions={[]}
              layout="mobile"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Action Buttons Component
 */
function ActionButtons<T>({
  item,
  primaryActions,
  secondaryActions,
  layout
}: {
  item: T;
  primaryActions: ActionDefinition[];
  secondaryActions: ActionDefinition[];
  layout: 'inline' | 'stacked' | 'mobile';
}) {
  const visiblePrimaryActions = primaryActions.filter(action => 
    !action.isVisible || action.isVisible(item)
  );
  
  const visibleSecondaryActions = secondaryActions.filter(action => 
    !action.isVisible || action.isVisible(item)
  );

  return (
    <div className={`gh-action-buttons gh-action-buttons-${layout}`}>
      {visiblePrimaryActions.map((action) => (
        <button
          key={action.key}
          className={`gh-btn gh-btn-${action.variant || 'primary'} gh-btn-responsive`}
          onClick={() => action.onClick(item)}
          disabled={action.isDisabled?.(item)}
          title={action.label}
        >
          {action.icon && <span className="gh-btn-icon">{action.icon}</span>}
          {layout !== 'mobile' && <span className="gh-btn-label">{action.label}</span>}
        </button>
      ))}
      
      {visibleSecondaryActions.length > 0 && layout === 'inline' && (
        <div className="gh-action-dropdown">
          {/* Dropdown menu for secondary actions */}
          <button className="gh-btn gh-btn-secondary gh-btn-responsive">
            <span>More</span>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Sort Icon Component
 */
function SortIcon({ 
  active, 
  direction 
}: { 
  active: boolean; 
  direction?: 'asc' | 'desc'; 
}) {
  return (
    <span className={`gh-sort-icon ${active ? 'active' : ''}`}>
      {direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '↕'}
    </span>
  );
}

/**
 * Loading Skeleton Component
 */
function DataDisplaySkeleton({ breakpoint }: { breakpoint: string }) {
  if (breakpoint === 'desktop') {
    return (
      <div className="gh-skeleton-table">
        <div className="gh-skeleton-header"></div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="gh-skeleton-row"></div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="gh-skeleton-cards">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="gh-skeleton-card"></div>
      ))}
    </div>
  );
}