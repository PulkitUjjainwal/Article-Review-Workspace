interface ReviewStatsChartProps {
  stats: {
    total: number;
    pending: number;
    included: number;
    excluded: number;
    maybe: number;
    percentComplete: number;
  };
}

export function ReviewStatsChart({ stats }: ReviewStatsChartProps) {
  const { total, pending, included, excluded, maybe } = stats;

  if (total === 0) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow-sm">
        <p className="text-gray-600">No articles to display stats for.</p>
      </div>
    );
  }

  // Calculate percentages
  const pendingPercent = (pending / total) * 100;
  const includedPercent = (included / total) * 100;
  const excludedPercent = (excluded / total) * 100;
  const maybePercent = (maybe / total) * 100;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Review Distribution
      </h3>

      {/* Stacked Bar Chart */}
      <div className="mb-6">
        <div className="flex h-8 overflow-hidden rounded-lg">
          {includedPercent > 0 && (
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${includedPercent}%` }}
              title={`Included: ${included} (${includedPercent.toFixed(1)}%)`}
            />
          )}
          {excludedPercent > 0 && (
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${excludedPercent}%` }}
              title={`Excluded: ${excluded} (${excludedPercent.toFixed(1)}%)`}
            />
          )}
          {maybePercent > 0 && (
            <div
              className="bg-yellow-500 transition-all"
              style={{ width: `${maybePercent}%` }}
              title={`Maybe: ${maybe} (${maybePercent.toFixed(1)}%)`}
            />
          )}
          {pendingPercent > 0 && (
            <div
              className="bg-gray-300 transition-all"
              style={{ width: `${pendingPercent}%` }}
              title={`Pending: ${pending} (${pendingPercent.toFixed(1)}%)`}
            />
          )}
        </div>
        <div className="mt-2 text-sm text-gray-600">
          {total} articles total
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-green-500" />
          <div className="text-sm">
            <div className="font-medium text-gray-900">{included}</div>
            <div className="text-gray-600">Included</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-red-500" />
          <div className="text-sm">
            <div className="font-medium text-gray-900">{excluded}</div>
            <div className="text-gray-600">Excluded</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-yellow-500" />
          <div className="text-sm">
            <div className="font-medium text-gray-900">{maybe}</div>
            <div className="text-gray-600">Maybe</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-gray-300" />
          <div className="text-sm">
            <div className="font-medium text-gray-900">{pending}</div>
            <div className="text-gray-600">Pending</div>
          </div>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="mt-6 border-t pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Review Progress</span>
          <span className="font-semibold text-gray-900">
            {stats.percentComplete}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${stats.percentComplete}%` }}
          />
        </div>
      </div>
    </div>
  );
}
