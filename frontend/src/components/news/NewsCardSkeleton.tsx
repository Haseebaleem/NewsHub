export function NewsCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="aspect-[16/9] w-full shimmer" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded-md shimmer" />
        <div className="h-4 w-1/2 rounded-md shimmer" />
        <div className="space-y-2 pt-1">
          <div className="h-3 w-full rounded-md shimmer" />
          <div className="h-3 w-5/6 rounded-md shimmer" />
        </div>
        <div className="flex items-center justify-between pt-3">
          <div className="h-3 w-24 rounded-md shimmer" />
          <div className="h-7 w-20 rounded-md shimmer" />
        </div>
      </div>
    </div>
  );
}

interface NewsGridSkeletonProps {
  count?: number;
}

export function NewsGridSkeleton({ count = 6 }: NewsGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <NewsCardSkeleton key={i} />
      ))}
    </div>
  );
}
