import { SkeletonStats, SkeletonGameCard } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="p-8 space-y-8">
      {/* Breadcrumb skeleton */}
      <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
      
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-96 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
      </div>
      
      {/* Stats skeleton */}
      <SkeletonStats />
      
      {/* Filters skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex gap-4">
          <div className="h-10 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-10 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-10 w-48 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Games list skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonGameCard key={i} />
        ))}
      </div>
    </div>
  );
}