export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 ${className}`}
      aria-busy="true"
      aria-live="polite"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <Skeleton className="mb-3 h-6 w-3/4" />
      <Skeleton className="mb-4 h-4 w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="divide-y divide-gray-200">
        {/* Header */}
        <div className="bg-gray-50 px-4 py-3">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <Skeleton className="mb-2 h-8 w-16" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <Skeleton className="mb-4 h-6 w-48" />
      <Skeleton className="mb-6 h-8 w-full" />
      <div className="grid grid-cols-4 gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    </div>
  );
}
