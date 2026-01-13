'use client';

import React from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { ResponsiveDataDisplay } from '@/components/data/ResponsiveDataDisplay';

interface DashboardStats {
  totalGames: number;
  publishedGames: number;
  draftGames: number;
  qcQueue: number;
  approvalQueue: number;
  activeUsers: number;
  storageUsed: string;
  lastSync: string;
}

interface GameSummary {
  id: string;
  title: string;
  status: string;
  version: string;
  owner: string;
  lastModified: string;
  priority: 'high' | 'medium' | 'low';
}

interface ResponsiveDashboardProps {
  stats: DashboardStats;
  recentGames: GameSummary[];
  className?: string;
}

/**
 * ResponsiveDashboard Component
 * 
 * Implements responsive dashboard patterns:
 * - Desktop: Full stats cards with detailed metrics and comprehensive data tables
 * - Tablet: Grouped stats with condensed information and card grid
 * - Mobile: Key metrics only with essential card list
 * 
 * Validates Requirements: 5.1, 5.2, 5.3, 5.4
 */
export function ResponsiveDashboard({
  stats,
  recentGames,
  className = ''
}: ResponsiveDashboardProps) {
  const { breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout className={className}>
      <div className="gh-dashboard-container">
        {/* Stats Section */}
        <div className="gh-dashboard-stats">
          {isDesktop && (
            <DesktopStatsCards stats={stats} />
          )}
          
          {isTablet && (
            <TabletGroupedStats stats={stats} />
          )}
          
          {isMobile && (
            <MobileKeyMetrics stats={stats} />
          )}
        </div>

        {/* Recent Games Section */}
        <div className="gh-dashboard-games">
          <div className="gh-section-header">
            <h2 className="gh-responsive-heading gh-font-semibold">
              Recent Games
            </h2>
            {!isMobile && (
              <DashboardFilters breakpoint={breakpoint} />
            )}
          </div>
          
          <ResponsiveDataDisplay
            data={recentGames}
            columns={getGameColumns()}
            primaryActions={getGameActions()}
            secondaryActions={getSecondaryActions()}
          />
        </div>

        {/* Quick Actions */}
        {!isMobile && (
          <div className="gh-dashboard-actions">
            <QuickActionCards breakpoint={breakpoint} />
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
}

/**
 * Desktop Stats Cards Component
 * Full detailed metrics with individual cards
 */
function DesktopStatsCards({ stats }: { stats: DashboardStats }) {
  const statCards = [
    {
      title: 'Total Games',
      value: stats.totalGames,
      icon: '🎮',
      trend: '+12%',
      trendType: 'positive' as const
    },
    {
      title: 'Published',
      value: stats.publishedGames,
      icon: '✅',
      trend: '+5%',
      trendType: 'positive' as const
    },
    {
      title: 'In Development',
      value: stats.draftGames,
      icon: '🔧',
      trend: '+8%',
      trendType: 'neutral' as const
    },
    {
      title: 'QC Queue',
      value: stats.qcQueue,
      icon: '⏳',
      trend: '-3%',
      trendType: 'negative' as const
    },
    {
      title: 'Approval Queue',
      value: stats.approvalQueue,
      icon: '📋',
      trend: '+2%',
      trendType: 'positive' as const
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: '👥',
      trend: '+15%',
      trendType: 'positive' as const
    },
    {
      title: 'Storage Used',
      value: stats.storageUsed,
      icon: '💾',
      trend: '+7%',
      trendType: 'neutral' as const
    },
    {
      title: 'Last Sync',
      value: stats.lastSync,
      icon: '🔄',
      trend: 'Just now',
      trendType: 'neutral' as const
    }
  ];

  return (
    <div className="gh-stats-grid-desktop">
      {statCards.map((card, index) => (
        <div key={index} className="gh-stat-card-desktop">
          <div className="gh-stat-header">
            <span className="gh-stat-icon">{card.icon}</span>
            <span className="gh-stat-title gh-responsive-meta gh-text-muted">
              {card.title}
            </span>
          </div>
          <div className="gh-stat-content">
            <span className="gh-stat-value gh-text-2xl gh-font-semibold">
              {card.value}
            </span>
            <span className={`gh-stat-trend gh-stat-trend-${card.trendType}`}>
              {card.trend}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Tablet Grouped Stats Component
 * Grouped related metrics with condensed display
 */
function TabletGroupedStats({ stats }: { stats: DashboardStats }) {
  const statGroups = [
    {
      title: 'Game Status',
      stats: [
        { label: 'Total', value: stats.totalGames, icon: '🎮' },
        { label: 'Published', value: stats.publishedGames, icon: '✅' },
        { label: 'Drafts', value: stats.draftGames, icon: '🔧' }
      ]
    },
    {
      title: 'Review Queue',
      stats: [
        { label: 'QC Queue', value: stats.qcQueue, icon: '⏳' },
        { label: 'Approval', value: stats.approvalQueue, icon: '📋' }
      ]
    },
    {
      title: 'System Status',
      stats: [
        { label: 'Active Users', value: stats.activeUsers, icon: '👥' },
        { label: 'Storage', value: stats.storageUsed, icon: '💾' },
        { label: 'Last Sync', value: stats.lastSync, icon: '🔄' }
      ]
    }
  ];

  return (
    <div className="gh-stats-groups-tablet">
      {statGroups.map((group, index) => (
        <div key={index} className="gh-stat-group-tablet">
          <h3 className="gh-stat-group-title gh-responsive-body gh-font-medium">
            {group.title}
          </h3>
          <div className="gh-stat-group-content">
            {group.stats.map((stat, statIndex) => (
              <div key={statIndex} className="gh-stat-item-tablet">
                <span className="gh-stat-icon-tablet">{stat.icon}</span>
                <div className="gh-stat-info">
                  <span className="gh-stat-label gh-responsive-meta gh-text-muted">
                    {stat.label}
                  </span>
                  <span className="gh-stat-value-tablet gh-responsive-body gh-font-medium">
                    {stat.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Mobile Key Metrics Component
 * Essential metrics only with large, touch-friendly display
 */
function MobileKeyMetrics({ stats }: { stats: DashboardStats }) {
  const keyMetrics = [
    {
      label: 'Games',
      value: stats.totalGames,
      subtext: `${stats.publishedGames} published`,
      icon: '🎮',
      color: 'primary'
    },
    {
      label: 'Queue',
      value: stats.qcQueue + stats.approvalQueue,
      subtext: 'pending review',
      icon: '⏳',
      color: 'warning'
    },
    {
      label: 'Users',
      value: stats.activeUsers,
      subtext: 'active now',
      icon: '👥',
      color: 'success'
    }
  ];

  return (
    <div className="gh-key-metrics-mobile">
      {keyMetrics.map((metric, index) => (
        <div key={index} className={`gh-key-metric-mobile gh-metric-${metric.color}`}>
          <div className="gh-metric-icon-mobile">
            {metric.icon}
          </div>
          <div className="gh-metric-content-mobile">
            <span className="gh-metric-value-mobile gh-text-xl gh-font-semibold">
              {metric.value}
            </span>
            <span className="gh-metric-label-mobile gh-responsive-body gh-font-medium">
              {metric.label}
            </span>
            <span className="gh-metric-subtext-mobile gh-responsive-meta gh-text-muted">
              {metric.subtext}
            </span>
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
  return (
    <div className={`gh-dashboard-filters gh-dashboard-filters-${breakpoint}`}>
      <select className="gh-filter-select gh-input-responsive">
        <option value="all">All Games</option>
        <option value="published">Published</option>
        <option value="draft">Drafts</option>
        <option value="qc">In QC</option>
      </select>
      
      <select className="gh-filter-select gh-input-responsive">
        <option value="recent">Recent</option>
        <option value="name">Name</option>
        <option value="status">Status</option>
      </select>
      
      {breakpoint === 'desktop' && (
        <input
          type="search"
          placeholder="Search games..."
          className="gh-search-input gh-input-responsive"
        />
      )}
    </div>
  );
}

/**
 * Quick Action Cards Component
 */
function QuickActionCards({ breakpoint }: { breakpoint: string }) {
  const quickActions = [
    {
      title: 'Upload New Game',
      description: 'Start uploading a new game build',
      icon: '⬆️',
      action: 'upload',
      color: 'primary'
    },
    {
      title: 'Review QC Queue',
      description: 'Check games pending QC review',
      icon: '🔍',
      action: 'qc-queue',
      color: 'warning'
    },
    {
      title: 'Manage Users',
      description: 'Add or modify user accounts',
      icon: '👥',
      action: 'users',
      color: 'secondary'
    },
    {
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: '⚙️',
      action: 'settings',
      color: 'secondary'
    }
  ];

  return (
    <div className={`gh-quick-actions gh-quick-actions-${breakpoint}`}>
      <h3 className="gh-responsive-heading gh-font-semibold">Quick Actions</h3>
      <div className="gh-quick-actions-grid">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className={`gh-quick-action-card gh-quick-action-${action.color}`}
            onClick={() => console.log(`Navigate to ${action.action}`)}
          >
            <div className="gh-quick-action-icon">
              {action.icon}
            </div>
            <div className="gh-quick-action-content">
              <span className="gh-quick-action-title gh-responsive-body gh-font-medium">
                {action.title}
              </span>
              {breakpoint === 'desktop' && (
                <span className="gh-quick-action-description gh-responsive-meta gh-text-muted">
                  {action.description}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Helper functions for data display configuration
 */
function getGameColumns() {
  return [
    {
      key: 'title',
      label: 'Game Title',
      priority: 'action' as const,
      render: (value: string, item: GameSummary) => (
        <div className="gh-game-title-cell">
          <span className="gh-game-title gh-font-medium">{value}</span>
          <span className="gh-game-id gh-text-muted">{item.id}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      priority: 'status' as const,
      render: (value: string) => (
        <span className={`gh-status-chip gh-status-${value.toLowerCase()}`}>
          {value}
        </span>
      )
    },
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
      key: 'lastModified',
      label: 'Last Modified',
      priority: 'metadata' as const
    }
  ];
}

function getGameActions() {
  return [
    {
      key: 'view',
      label: 'View',
      icon: '👁',
      variant: 'secondary' as const,
      onClick: (item: GameSummary) => console.log('View game', item.id)
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: '✏️',
      variant: 'primary' as const,
      onClick: (item: GameSummary) => console.log('Edit game', item.id)
    }
  ];
}

function getSecondaryActions() {
  return [
    {
      key: 'duplicate',
      label: 'Duplicate',
      icon: '📋',
      variant: 'secondary' as const,
      onClick: (item: GameSummary) => console.log('Duplicate game', item.id)
    },
    {
      key: 'archive',
      label: 'Archive',
      icon: '📦',
      variant: 'secondary' as const,
      onClick: (item: GameSummary) => console.log('Archive game', item.id)
    }
  ];
}