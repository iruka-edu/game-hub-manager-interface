import { Skeleton, SkeletonCard, SkeletonTable, SkeletonGameCard, SkeletonStats } from './Skeleton';

interface LoadingStateProps {
  type?: 'card' | 'table' | 'game-card' | 'stats' | 'detail' | 'list';
  count?: number;
  message?: string;
}

export function LoadingState({ type = 'card', count = 3, message }: LoadingStateProps) {
  return (
    <div className="animate-in fade-in duration-300">
      {message && (
        <div className="mb-4 text-center">
          <p className="text-sm text-slate-500">{message}</p>
        </div>
      )}
      
      {type === 'card' && (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}
      
      {type === 'table' && <SkeletonTable rows={count} />}
      
      {type === 'game-card' && (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <SkeletonGameCard key={i} />
          ))}
        </div>
      )}
      
      {type === 'stats' && <SkeletonStats />}
      
      {type === 'list' && (
        <div className="space-y-2">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmptyState({ 
  icon = '📭',
  title = 'No data found',
  description,
  action
}: {
  icon?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mb-6 max-w-md">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading data. Please try again.',
  onRetry
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-md">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-indigo-600 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

export function InlineLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <LoadingSpinner size="sm" />
      <span>{text}</span>
    </div>
  );
}