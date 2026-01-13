'use client';

import React from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { ResponsiveLayout, ResponsiveContainer } from '@/components/layout/ResponsiveLayout';
import { ResponsiveDataDisplay } from '@/components/data/ResponsiveDataDisplay';
import { AdaptiveActionBar } from '@/components/actions/AdaptiveActionBar';

interface DashboardStats {
  totalGames: number;
  publishedGames: number;
  draftGames: number;
  qcQueue: number;
  approvalQueue: number;
}

interface GameSummary {
  id: string;
  title: string;
  status: string;
  version: string;
  owner: string;
  lastUpdated: string;
  priority: 'high' | 'medium' | 'low';
}

interface ResponsiveDashboardProps {
  stats: DashboardStats;
  recentGames: GameSummary[];
  qcQueue: GameSummary[];
  onRefresh: () => void;
  onNavigate: (path: string) => void;
}

/**
 * ResponsiveDashboard Component
 * 
 * Implements responsive dashboard patterns:
 * - Desktop: Full stats cards with detailed metrics and charts
 * - Tablet: Grouped stats with essential filters and card grid
 * - Mobile: Key metrics only with simplified search and card list
 * 
 * Validates Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function ResponsiveDashboard({
  stats,
  recentGames,
  qcQueue,
  onRefresh,
  onNavigate
}: ResponsiveDashboardProps) {
  const { breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();

  const dashboardActions = [
    {
      key: 'refresh',
      label: 'Refresh',
      icon: '🔄',
      variant: 'secondary' as const,
      onClick: onRefresh
    },
    {
      key: 'upload',
      label: 'Upload Game',
      icon: '📤',
      variant: 'primary' as const,
      onClick: () => onNavigate('/console/upload')
    }
  ];

  return (
    <ResponsiveLayout
      className="gh-dashboard"
      actionBar={
        <AdaptiveActionBar
          primaryActions={dashboardActions.filter(a => a.variant === 'primary')}
          secondaryActions={dashboardActions.filter(a => a.variant === 'secondary')}
          position="inline"
        />
      }
    >
      <ResponsiveContainer>
        {/* Stats Section */}
        <section className="gh-dashboard-stats">
          <h2 className="gh-responsive-heading gh-font-semibold">Dashboard Overview</h2>
          
          {isDesktop && (
            <DesktopStatsCards stats={stats} onNavigate={onNavigate} />
          )}
          
          {isTablet && (
            <TabletStatsCards stats={stats} onNavigate={onNavigate} />
          )}
          
          {isMobile && (
            <MobileStatsCards stats={stats} onNavigate={onNavigate} />
          )}
        </section>

        {/* Recent Games Section */}
        <section className="gh-dashboard-games">
          <div className="gh-section-header">
            <h3 className="gh-responsive-heading gh-font-medium">Recent Games</h3>
            {!isMobile && (
              <DashboardFilters breakpoint={breakpoint} />
            )}
          </div>
          
          <ResponsiveDataDisplay
            data={recentGames}
            columns={getGameColumns(breakpoint)}
            primaryActions={getGameActions(onNavigate)}
            loading={false}
            emptyMessage="No games found"
          />
        </section>

        {/* QC Queue Section - Hidden on mobile */}
        {!isMobile && (
          <section className="gh-dashboard-qc">
            <h3 className="gh-responsive-heading gh-font-medium">QC Queue</h3>
            <ResponsiveDataDisplay
              data={qcQueue}
              columns={getQcColumns(breakpoint)}
              primaryActions={getQcActions(onNavigate)}
              loading={false}
              emptyMessage="No games in QC queue"
            />
          </section>
        )}
      </ResponsiveContainer>
    </ResponsiveLayout>
  );
}

/**
 * Desktop Stats Cards Component
 */
function DesktopStatsCards({ stats, onNavigate }: { 
  stats: DashboardStats; 
  onNavigate: (path: string) => void; 
}) {
  const statCards = [
    {
      title: 'Total Games',
      value: stats.totalGames,
      icon: '🎮',
      color: 'primary',
      action: () => onNavigate('/console/games')
    },
    {
      title: 'Published',
      value: stats.publishedGames,
      icon: '✅',
      color: 'success',
      action: () => onNavigate('/console/games?status=published')
    },
    {
      title: 'Drafts',
      value: stats.draftGames,
      icon: '📝',
      color: 'warning',
      action: () => onNavigate('/console/games?status=draft')
    },
    {
      title: 'QC Queue',
      value: stats.qcQueue,
      icon: '🔍',
      color: 'info',
      action: () => onNavigate('/console/qc-inbox')
    },
    {
      title: 'Approval Queue',
      value: stats.approvalQueue,
      icon: '⏳',
      color: 'warning',
      action: () => onNavigate('/console/games?status=qc_passed')
    }
  ];

  return (
    <div className="gh-stats-grid-desktop">
      {statCards.map((card) => (
        <div
          key={card.title}
          className={`gh-stat-card gh-stat-card-${card.color}`}
          onClick={card.action}
        >
          <div className="gh-stat-icon">{card.icon}</div>
          <div className="gh-stat-content">
            <div className="gh-stat-value">{card.value}</div>
            <div className="gh-stat-title">{card.title}</div>
          </div>
          <div className="gh-stat-trend">
            {/* Placeholder for trend indicators */}
            <span className="gh-stat-change">+5%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Tablet Stats Cards Component
 */
function TabletStatsCards({ stats, onNavigate }: { 
  stats: DashboardStats; 
  onNavigate: (path: string) => void; 
}) {
  const groupedStats = [
    {
      title: 'Games Overview',
      stats: [
        { label: 'Total', value: stats.totalGames, action: () => onNavigate('/console/games') },
        { label: 'Published', value: stats.publishedGames, action: () => onNavigate('/console/games?status=published') }
      ]
    },
    {
      title: 'Workflow Status',
      stats: [
        { label: 'Drafts', value: stats.draftGames, action: () => onNavigate('/console/games?status=draft') },
        { label: 'QC Queue', value: stats.qcQueue, action: () => onNavigate('/console/qc-inbox') },
        { label: 'Approval', value: stats.approvalQueue, action: () => onNavigate('/console/games?status=qc_passed') }
      ]
    }
  ];

  return (
    <div className="gh-stats-grid-tablet">
      {groupedStats.map((group) => (
        <div key={group.title} className="gh-stat-group">
          <h4 className="gh-stat-group-title">{group.title}</h4>
          <div className="gh-stat-group-items">
            {group.stats.map((stat) => (
              <div
                key={stat.label}
                className="gh-stat-item"
                onClick={stat.action}
              >
                <span className="gh-stat-item-value">{stat.value}</span>
                <span className="gh-stat-item-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Mobile Stats Cards Component
 */
function MobileStatsCards({ stats, onNavigate }: { 
  stats: DashboardStats; 
  onNavigate: (path: string) => void; 
}) {
  const keyMetrics = [
    {
      label: 'Total Games',
      value: stats.totalGames,
      icon: '🎮',
      action: () => onNavigate('/console/games')
    },
    {
      label: 'QC Queue',
      value: stats.qcQueue,
      icon: '🔍',
      action: () => onNavigate('/console/qc-inbox'),
      highlight: stats.qcQueue > 0
    }
  ];

  return (
    <div className="gh-stats-mobile">
      {keyMetrics.map((metric) => (
        <div
          key={metric.label}
          className={`gh-key-metric ${metric.highlight ? 'highlight' : ''}`}
          onClick={metric.action}
        >
          <div className="gh-key-metric-icon">{metric.icon}</div>
          <div className="gh-key-metric-content">
            <div className="gh-key-metric-value">{metric.value}</div>
            <div className="gh-key-metric-label">{metric.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Dashboard Filters Component
 */
function DashboardFilters({ breakpoint }: { breakpoint: string }) {
  if (breakpoint === 'mobile') {
    return (
      <div className="gh-dashboard-search-mobile">
        <input
          type="search"
          placeholder="Search games..."
          className="gh-input-responsive"
        />
      </div>
    );
  }

  return (
    <div className="gh-dashboard-filters">
      <input
        type="search"
        placeholder="Search games..."
        className="gh-input-responsive"
      />
      <select className="gh-input-responsive">
        <option value="">All Status</option>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="qc_processing">In QC</option>
      </select>
      {breakpoint === 'desktop' && (
        <select className="gh-input-responsive">
          <option value="">All Owners</option>
          <option value="me">My Games</option>
        </select>
      )}
    </div>
  );
}

/**
 * Column definitions for game data
 */
function getGameColumns(breakpoint: string) {
  const baseColumns = [
    {
      key: 'title',
      label: 'Game Title',
      priority: 'action' as const,
      render: (value: string) => (
        <span className="gh-responsive-body gh-font-medium">{value}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      priority: 'status' as const,
      render: (value: string) => (
        <span className={`gh-status-chip gh-status-${value}`}>{value}</span>
      )
    }
  ];

  if (breakpoint === 'desktop') {
    return [
      ...baseColumns,
      {
        key: 'version',
        label: 'Version',
        priority: 'data' as const
      },
      {
        key: 'owner',
        label: 'Owner',
        priority: 'metadata' as const
      },
      {
        key: 'lastUpdated',
        label: 'Last Updated',
        priority: 'metadata' as const
      }
    ];
  }

  if (breakpoint === 'tablet') {
    return [
      ...baseColumns,
      {
        key: 'version',
        label: 'Version',
        priority: 'data' as const
      }
    ];
  }

  return baseColumns;
}

/**
 * Action definitions for games
 */
function getGameActions(onNavigate: (path: string) => void) {
  return [
    {
      key: 'view',
      label: 'View',
      icon: '👁',
      onClick: (item: GameSummary) => onNavigate(`/console/games/${item.id}`)
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: '✏️',
      onClick: (item: GameSummary) => onNavigate(`/console/games/${item.id}/edit`)
    }
  ];
}

/**
 * Column definitions for QC queue
 */
function getQcColumns(breakpoint: string) {
  const baseColumns = [
    {
      key: 'title',
      label: 'Game Title',
      priority: 'action' as const
    },
    {
      key: 'priority',
      label: 'Priority',
      priority: 'status' as const,
      render: (value: string) => (
        <span className={`gh-priority-badge priority-${value}`}>{value}</span>
      )
    }
  ];

  if (breakpoint === 'desktop') {
    return [
      ...baseColumns,
      {
        key: 'owner',
        label: 'Owner',
        priority: 'data' as const
      },
      {
        key: 'lastUpdated',
        label: 'Submitted',
        priority: 'metadata' as const
      }
    ];
  }

  return baseColumns;
}

/**
 * Action definitions for QC queue
 */
function getQcActions(onNavigate: (path: string) => void) {
  return [
    {
      key: 'review',
      label: 'Review',
      icon: '🔍',
      variant: 'primary' as const,
      onClick: (item: GameSummary) => onNavigate(`/console/qc/${item.id}`)
    }
  ];
}