import { TableSkeleton } from "~/components/ui/Skeleton";

export default function ArticlesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
            <div className="flex-1">
              <div className="mb-1 h-4 w-64 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="h-12 flex-1 min-w-[300px] animate-pulse rounded-lg bg-gray-200" />
          <div className="h-12 w-40 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-12 w-48 animate-pulse rounded-lg bg-gray-200" />
        </div>

        {/* Table */}
        <TableSkeleton rows={10} />
      </main>
    </div>
  );
}
