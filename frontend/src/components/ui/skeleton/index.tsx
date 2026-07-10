import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SkeletonProps {
  readonly className?: string;
}

export function Skeleton({ className }: SkeletonProps): ReactNode {
  return <div className={cn("skeleton shimmer-bg", className)} />;
}

export function SkeletonCard(): ReactNode {
  return (
    <div className="card p-4 sm:p-5">
      <Skeleton className="mb-3 h-3.5 w-20 sm:w-24" />
      <Skeleton className="h-7 w-14 sm:h-8 sm:w-16" />
    </div>
  );
}

export function SkeletonRow(): ReactNode {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Skeleton className="h-4 w-32 sm:w-48" />
      <Skeleton className="hidden h-4 w-20 sm:block sm:w-24" />
      <Skeleton className="hidden h-4 w-16 sm:block sm:w-20" />
      <Skeleton className="ml-auto h-6 w-16 rounded-full sm:w-20" />
    </div>
  );
}

export function SkeletonPage(): ReactNode {
  return (
    <div className="animate-in">
      {/* Fake page header */}
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <Skeleton className="mb-2 h-5 w-36 sm:h-6 sm:w-48" />
            <Skeleton className="hidden h-3.5 w-48 sm:block sm:w-64" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl sm:w-32" />
        </div>
      </div>
      {/* Content */}
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="card overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border-b border-slate-50 last:border-0">
              <SkeletonRow />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
