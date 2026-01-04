'use client';

import { cn } from '@/lib/utils';

interface PointsSkeletonProps {
  className?: string;
}

export function PointsSkeleton({ className }: PointsSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Hero Card Skeleton */}
      <div className="h-40 rounded-3xl skeleton" />

      {/* Quick Actions Skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-24 rounded skeleton" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl skeleton" />
              <div className="h-3 w-12 rounded skeleton" />
            </div>
          ))}
        </div>
      </div>

      {/* Section Header Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded skeleton" />
        <div className="h-5 w-24 rounded skeleton" />
      </div>

      {/* Transaction List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 rounded-2xl border bg-card"
          >
            {/* Icon skeleton */}
            <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />

            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded skeleton" />
              <div className="h-3 w-1/2 rounded skeleton" />
            </div>

            {/* Amount skeleton */}
            <div className="h-5 w-16 rounded skeleton flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
