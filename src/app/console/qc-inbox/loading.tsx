import { SkeletonGameCard } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="p-8 space-y-8">
      {/* Breadcrumb skeleton */}
      <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
      
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-slate-200 rounded animate-pulse" />
      </div>
      
      {/* Tabs skeleton */}
      <div className="flex gap-4 border-b border-slate-200">
        <div className="h-10 w-32 bg-slate-200 rounded-t animate-pulse" />
        <div className="h-10 w-32 bg-slate-200 rounded-t animate-pulse" />
      </div>
      
      {/* Games list skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonGameCard key={i} />
        ))}
      </div>
    </div>
  );
}