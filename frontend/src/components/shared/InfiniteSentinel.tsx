import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteSentinelProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

/**
 * IntersectionObserver-based load-more trigger. Renders an
 * unobtrusive spinner row when there's more to fetch and a quiet
 * "End of feed" line when there isn't.
 */
export function InfiniteSentinel({ hasMore, isLoading, onLoadMore }: InfiniteSentinelProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = ref.current;
    if (target === null || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting === true) onLoadMore();
      },
      { rootMargin: '320px 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <div ref={ref} className="grid place-items-center py-10">
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading more…
        </div>
      ) : !hasMore ? (
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          End of feed
        </span>
      ) : null}
    </div>
  );
}
