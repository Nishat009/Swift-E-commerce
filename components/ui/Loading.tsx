export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-ink" role="status" aria-label="Loading"></div>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 mb-4"></div>
      <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4 mb-2"></div>
      <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-1/2"></div>
    </div>
  );
}

