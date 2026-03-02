export function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
    </div>
  );
}

export function ScheduleSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
      <div className="animate-pulse space-y-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-gray-200 dark:bg-gray-700 rounded"
          ></div>
        ))}
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="animate-pulse">
        {/* New Note button skeleton */}
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>

        {/* Calendar header skeleton (prev / month / next) */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="w-28 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {[...Array(7)].map((_, i) => (
            <div
              key={`header-${i}`}
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-6"
            ></div>
          ))}
        </div>

        {/* Calendar grid (5 rows x 7 cols) */}
        {[...Array(5)].map((_, row) => (
          <div key={`row-${row}`} className="grid grid-cols-7 gap-1 mb-1">
            {[...Array(7)].map((_, col) => (
              <div
                key={`cell-${row}-${col}`}
                className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
