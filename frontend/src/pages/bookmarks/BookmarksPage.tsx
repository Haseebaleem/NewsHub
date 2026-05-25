import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { isThisWeek, isToday, isYesterday } from 'date-fns';
import { Bookmark as BookmarkIcon, Search, X } from 'lucide-react';
import { listBookmarks } from '@/api/bookmarks';
import { BookmarkCard } from '@/components/news/BookmarkCard';
import { NewsGridSkeleton } from '@/components/news/NewsCardSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { InfiniteSentinel } from '@/components/shared/InfiniteSentinel';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { Bookmark, Paginated } from '@/types/api';

const GROUP_ORDER = ['Today', 'Yesterday', 'Earlier this week', 'Earlier'] as const;
type GroupLabel = (typeof GROUP_ORDER)[number];

function groupOf(iso: string): GroupLabel {
  const date = new Date(iso);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date, { weekStartsOn: 1 })) return 'Earlier this week';
  return 'Earlier';
}

export function BookmarksPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const debouncedFilter = useDebouncedValue(filter, 150);

  const query = useInfiniteQuery<
    Paginated<Bookmark>,
    Error,
    { pages: Paginated<Bookmark>[] },
    readonly [string, string]
  >({
    queryKey: ['bookmarks', 'page'] as const,
    queryFn: async ({ pageParam = 1 }) => listBookmarks(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
  });

  const allBookmarks = useMemo(
    () => query.data?.pages.flatMap((p) => p.data) ?? [],
    [query.data],
  );

  const total = query.data?.pages[0]?.meta.total ?? 0;

  const visible = useMemo(() => {
    const needle = debouncedFilter.trim().toLowerCase();
    if (needle === '') return allBookmarks;
    return allBookmarks.filter((b) => {
      const haystack = `${b.title} ${b.source} ${b.author ?? ''} ${b.description ?? ''}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [allBookmarks, debouncedFilter]);

  const grouped = useMemo<Map<GroupLabel, Bookmark[]>>(() => {
    const map = new Map<GroupLabel, Bookmark[]>();
    for (const b of visible) {
      const key = groupOf(b.created_at);
      const bucket = map.get(key) ?? [];
      bucket.push(b);
      map.set(key, bucket);
    }
    return map;
  }, [visible]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your Bookmarks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total === 0
              ? 'Articles you save appear here.'
              : `${total.toLocaleString()} saved article${total === 1 ? '' : 's'}.`}
          </p>
        </div>

        {allBookmarks.length > 0 ? (
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter your bookmarks…"
              className="h-9 pl-9 pr-9 text-sm"
              aria-label="Filter bookmarks"
            />
            {filter !== '' ? (
              <button
                type="button"
                onClick={() => setFilter('')}
                className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Clear filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      {query.isLoading ? (
        <NewsGridSkeleton />
      ) : allBookmarks.length === 0 ? (
        <EmptyState
          Icon={BookmarkIcon}
          title="No bookmarks yet"
          description="Save articles from the feed and they'll show up here."
          action={{ label: 'Browse the feed', onClick: () => navigate('/feed') }}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          Icon={Search}
          title="Nothing matches your filter"
          description={`No saved articles match "${debouncedFilter}". Try a different word.`}
          action={{ label: 'Clear filter', onClick: () => setFilter('') }}
        />
      ) : (
        <div className="space-y-10">
          {GROUP_ORDER.map((label) => {
            const items = grouped.get(label);
            if (items === undefined || items.length === 0) return null;
            return (
              <section key={label}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {label}
                  </h2>
                  <span className="font-mono text-xs text-muted-foreground/70">
                    {items.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((b) => (
                    <BookmarkCard key={b.id} bookmark={b} />
                  ))}
                </div>
              </section>
            );
          })}

          <InfiniteSentinel
            hasMore={query.hasNextPage === true && debouncedFilter === ''}
            isLoading={query.isFetchingNextPage}
            onLoadMore={() => {
              if (!query.isFetchingNextPage && query.hasNextPage === true) {
                void query.fetchNextPage();
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
