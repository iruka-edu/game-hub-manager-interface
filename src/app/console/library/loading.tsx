import { SkeletonTable } from '@/components/ui/Skeleton';

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
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Filters skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Table skeleton */}
      <SkeletonTable rows={10} columns={6} />
    </div>
  );
}