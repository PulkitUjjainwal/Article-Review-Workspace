import { StatCardSkeleton, ChartSkeleton } from "~/components/ui/Skeleton";

export default function ProjectLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
              <div>
                <div className="mb-1 h-4 w-48 animate-pulse rounded bg-gray-200" />
                <div className="mb-2 h-8 w-64 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-96 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
            <div className="h-8 w-20 animate-pulse rounded-full bg-gray-200" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Chart */}
        <div className="mb-8">
          <ChartSkeleton />
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 border-b">
          <div className="flex gap-8">
            <div className="h-12 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-12 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-12 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        {/* Content Area */}
        <div className="h-96 animate-pulse rounded-lg bg-gray-200" />
      </main>
    </div>
  );
}
