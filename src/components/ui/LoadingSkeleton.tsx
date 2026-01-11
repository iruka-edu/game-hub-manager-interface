interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'table' | 'avatar';
  lines?: number;
  className?: string;
}

export function LoadingSkeleton({ variant = 'text', lines = 1, className = '' }: LoadingSkeletonProps) {
  if (variant === 'avatar') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="w-10 h-10 bg-slate-200 rounded-full" />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`animate-pulse bg-white border border-slate-200 rounded-xl p-6 ${className}`}>
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-4" />
        <div className="h-3 bg-slate-200 rounded w-full mb-2" />
        <div className="h-3 bg-slate-200 rounded w-5/6 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-4/6" />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`animate-pulse ${className}`}>
        {/* Header */}
        <div className="flex gap-4 p-4 border-b border-slate-200">
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-4 bg-slate-200 rounded w-1/4" />
        </div>
        {/* Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b border-slate-100">
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-4 bg-slate-100 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  // Default: text lines
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-200 rounded"
          style={{ width: `${Math.max(40, 100 - i * 15)}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeleton key={i} variant="card" />
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return <LoadingSkeleton variant="table" />;
}
